import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type Variant = {
  id: string;
  available: boolean;
  attributes: {
    packaging: string;
    description: string;
  };
  cost: number;
  currency: string;
  depth: number;
  description: string;
  dimensionUom: string;
  height: number;
  width: number;
  manufacturerItemCode: string;
  manufacturerItemId: string;
  packaging: string;
  price: number;
  volume: number;
  volumeUom: string;
  weight: number;
  weightUom: string;
  optionName: string;
  optionsPath: string;
  optionItemsPath: string;
  sku: string;
  active: boolean;
  images: {
    fileName: string;
    cdnLink: string;
    i: number;
    alt: string;
  }[];
  itemCode: string;
};

export type Option = {
  id: string;
  name: string;
  dataField: string;
  values: {
    id: string;
    name: string;
    value: string;
  }[];
};

@Schema()
export class Product extends Document {
  @Prop()
  docId: string;

  @Prop({ type: String })
  productId: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: String, enum: ['non-inventory'] })
  type: string;

  @Prop({ type: String })
  shortDescription: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: String })
  vendorId: string;

  @Prop({ type: String })
  manufacturerId: string;

  @Prop({ type: String })
  storefrontPriceVisibility: string;

  @Prop({ type: [Object] })
  variants: Variant[];

  @Prop({ type: [Object] })
  options: Option[];

  @Prop({ type: String })
  availability: string;

  @Prop({ type: Boolean })
  isFragile: boolean;

  @Prop({ type: Boolean })
  published: boolean;

  @Prop({ type: Boolean })
  isTaxable: boolean;

  @Prop({
    type: [
      {
        fileName: { type: String },
        cdnLink: { type: String },
        i: { type: Number },
        alt: { type: String },
      },
    ],
  })
  images: {
    fileName: string;
    cdnLink: string;
    i: number;
    alt: string;
  }[];

  @Prop({ type: String })
  categoryId: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
// Apply a unique index on the sku field within variants
//ProductSchema.index({ 'variants.sku': 1 }, { unique: true });
