import { Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export abstract class BaseModel {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  creator?: string;

  @Prop({ required: false })
  deletedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}
