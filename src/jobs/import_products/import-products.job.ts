import { LangChainService } from 'src/services/langchain';
import { Product } from './../../schemas/product.schema';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createReadStream } from 'fs';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { parse } from 'csv-parse';
import * as path from 'path';
import { createHash } from 'crypto';
import { nanoid } from 'nanoid';

@Injectable()
export class ImportProductsService {
  private readonly CHUNK_SIZE = 1000;
  private readonly DESCRIPTION_ENHANCE_LIMIT = 10;
  private products = {};
  private productOptions = {};

  private readonly logger = new Logger(ImportProductsService.name);
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    private readonly langChainService: LangChainService,
  ) {}

  @Cron('0 39 6 * * *')
  async handleCron() {
    const inputStoragePath = path.resolve(__dirname, '../../../storage/input');
    this.logger.debug('Called when the current second is 45');
    await this.processCsvFile(path.resolve(inputStoragePath, 'images40.csv'));
    await this.enhanceDescription();
  }

  processCsvFile(inputFilePath) {
    let rowCount = 0;
    const inputStream = createReadStream(inputFilePath);
    return new Promise((resolve, reject) => {
      let pipeLine = inputStream
        .pipe(
          parse({
            delimiter: '\t',
            columns: true,
            relax_quotes: true,
            relax_column_count: true,
            skip_empty_lines: true, // Skip empty lines
          }),
        )
        .on('data', async (row) => {
          rowCount += 1;
          this.mapCSVRowTOJSONFormat(row);
          if (this.CHUNK_SIZE == rowCount) {
            console.log(rowCount);
            pipeLine.pause();
            const productsList = Object.values(this.products);
            await this.insertOrUpdateProducts(productsList);
            this.products = {};
            this.productOptions = {};
            console.log('resume');
            rowCount = 0;
            pipeLine.resume();
          }
        })
        .on('error', async (err) => {
          console.log(err);
        })
        .on('end', async () => {
          const productsList = Object.values(this.products);
          if (productsList.length) {
            const productsList = Object.values(this.products);
            await this.insertOrUpdateProducts(productsList);
            this.products = {};
            this.productOptions = {};
          }

          console.log('done');
          resolve('done');
        });
    });
  }
  private async insertOrUpdateProducts(products) {
    const bulkOps = products.flatMap((product) => {
      const {
        productId,
        variants,
        options,
        ...productWithoutVariantsAndOptions
      } = product;

      // Prepare operations to update existing variants and add new variants
      const variantOps = variants.map((variant) => ({
        updateOne: {
          filter: { productId: productId },
          update: { $pull: { variants: { sku: variant.sku } } },
        },
      }));
      // Operation to update the main product document (excluding variants)
      const updateProductOp = {
        updateOne: {
          filter: { productId: productId },
          update: {
            $set: productWithoutVariantsAndOptions,
            $addToSet: {
              options: { $each: options || [] },
              variants: { $each: variants || [] },
            },
          },
          upsert: true,
        },
      };
      // Combine the update operations
      return [...variantOps, updateProductOp];
    });

    // Perform bulkWrite with combined operations
    await this.productModel.bulkWrite(bulkOps);
  }

  private getVendorId(): string {
    // Simulate
    return 'VfoeB-qlPBfT4NslMUR_V0zT';
  }

  private setProductOption(productId, row) {
    if (!this.productOptions[productId]) {
      this.productOptions[productId] = {
        Pkg: {
          id: this.hashString(`opt_pkg_${productId}`),
          options: {},
        },
        ItemDescription: {
          id: this.hashString(`opt_desc_${productId}`),
          options: {},
        },
      };
    }

    const pkgOptions = this.productOptions[productId]['Pkg']['options'];
    const itemDescriptionOptions =
      this.productOptions[productId]['ItemDescription']['options'];

    if (!pkgOptions[row['PKG']]) {
      pkgOptions[row['PKG']] = this.hashString(
        `$opt_pkg_${productId}_${row['PKG']}`,
      );
    }

    if (!itemDescriptionOptions[row['ItemDescription']]) {
      itemDescriptionOptions[row['ItemDescription']] = this.hashString(
        `$opt_des_${productId}_${row['ItemDescription']}`,
      );
    }
  }

  private hashString(text: string, length: number = 10): string {
    return createHash('sha256').update(text).digest('hex').substring(0, length);
  }

  private mapCSVRowTOJSONFormat(row) {
    const productId = row['ProductID'];
    this.setProductOption(productId, row);
    if (!this.products[productId]) {
      this.products[productId] = {
        docId: nanoid(),
        productId,
        name: row['ProductName'],
        type: 'non-inventory',
        shortDescription: '',
        description: row['ProductDescription'],
        vendorId: this.getVendorId(),
        manufacturerId: row['ManufacturerID'],
        storefrontPriceVisibility: 'members-only',
        variants: [],
        options: [],
        availability: row['Availability'],
        isFragile: false,
        published: true,
        isTaxable: true,
        images: [
          {
            fileName: row['ImageFileName'],
            cdnLink: row['ItemImageURL'],
            i: 0,
            alt: null,
          },
        ],
        categoryId: row['CategoryID'],
      };
    }
    const variantId = row['ItemID'];
    const variant = {
      id: variantId,
      available: row['QuantityOnHand'] > 0,
      attributes: {
        packaging: row['PKG'],
        description: row['ItemDescription'],
      },
      cost: parseFloat(row['UnitPrice']) - parseFloat(row['UnitPrice']) * 0.4,
      currency: 'USD',
      depth: null,
      description: row['ItemDescription'],
      dimensionUom: null,
      height: null,
      width: null,
      manufacturerItemCode: row['ManufacturerItemCode'],
      manufacturerItemId: row['ManufacturerID'],
      packaging: row['PKG'],
      price: parseFloat(row['UnitPrice']),
      volume: null,
      volumeUom: null,
      weight: null,
      weightUom: null,
      optionName: `${row['PKG']}, ${row['ItemDescription']}`,
      optionsPath: `${this.productOptions[productId]['Pkg']['id']}.${this.productOptions[productId]['ItemDescription']['id']}`,
      optionItemsPath: `${this.productOptions[productId]['Pkg']['options'][row['PKG']]}.${this.productOptions[productId]['ItemDescription']['options'][row['ItemDescription']]}`,
      sku: `${productId}_${variantId}`,
      active: true,
      images: [
        {
          fileName: row['ImageFileName'],
          cdnLink: row['ItemImageURL'],
          i: 0,
          alt: null,
        },
      ],
      itemCode: row['NDCItemCode'],
    };

    this.products[productId].variants.push(variant);

    // Add options
    this.products[productId].options = [
      {
        id: `${this.productOptions[productId]['Pkg']['id']}`,
        name: 'packaging',
        dataField: null,
        values: [
          {
            id: `${this.productOptions[productId]['Pkg']['options'][row['PKG']]}`,
            name: row['PKG'],
            value: row['PKG'],
          },
        ],
      },
      {
        id: `${this.productOptions[productId]['ItemDescription']['id']}`,
        name: 'description',
        dataField: null,
        values: [
          {
            id: `${this.productOptions[productId]['ItemDescription']['options'][row['ItemDescription']]}`,
            name: row['ItemDescription'],
            value: row['ItemDescription'],
          },
        ],
      },
    ];
  }
  private async enhanceDescription() {
    const products: any = await this.productModel
      .find({ vendorId: this.getVendorId() })
      .limit(10);

    for (const product of products) {
      const newDescription =
        await this.langChainService.enhanceProductDescriptions({
          productName: product.name,
          description: product.description,
          categoryName: product.category,
        });
    }
  }
}
