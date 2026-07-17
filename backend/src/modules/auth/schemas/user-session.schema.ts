import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserSessionDocument = HydratedDocument<UserSession>;

@Schema({ collection: 'user_sessions', timestamps: true })
export class UserSession {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  refreshToken!: string;

  @Prop({ default: null })
  ipAddress?: string;

  @Prop({ default: null })
  userAgent?: string;

  @Prop({ required: true, index: true })
  expiresAt!: Date;

  @Prop({ required: true, default: true })
  isValid!: boolean;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);
