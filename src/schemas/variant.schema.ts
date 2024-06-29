import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class Variant extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product' }) // Reference to Product schema
  productId: Types.ObjectId;

  @Prop()
  id: string;

  @Prop({ default: true })
  available: boolean;

  @Prop({ type: { packaging: String, description: String } })
  attributes: { packaging: string; description: string };

  @Prop({ required: true })
  cost: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  depth: number;

  @Prop()
  description: string;

  @Prop()
  dimensionUom: string;

  @Prop()
  height: number;

  @Prop()
  width: number;

  @Prop()
  manufacturerItemCode: string;

  @Prop()
  manufacturerItemId: string;

  @Prop()
  packaging: string;

  @Prop({ required: true })
  price: number;

  @Prop()
  volume: number;

  @Prop()
  volumeUom: string;

  @Prop()
  weight: number;

  @Prop()
  weightUom: string;

  @Prop()
  optionName: string;

  @Prop()
  optionsPath: string;

  @Prop()
  optionItemsPath: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({
    type: [{ fileName: String, cdnLink: String, i: Number, alt: String }],
  })
  images: { fileName: string; cdnLink: string; i: number; alt: string }[];

  @Prop()
  itemCode: string;
}

export const VariantSchema = SchemaFactory.createForClass(Variant);
