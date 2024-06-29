import { Module } from '@nestjs/common';
import { ImportProductsService } from './import-products.job';
import { Product, ProductSchema } from '../../schemas/product.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { LangChainService } from 'src/services/langchain';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  providers: [ImportProductsService, LangChainService],
})
export class ImportProductsModule {}
