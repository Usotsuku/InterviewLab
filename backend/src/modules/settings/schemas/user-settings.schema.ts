import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserSettingsDocument = HydratedDocument<UserSettings>;

@Schema({ collection: 'user_settings', timestamps: true })
export class UserSettings {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, default: 'en', trim: true })
  language!: string;

  @Prop({ required: true, default: true })
  notificationsEnabled!: boolean;

  @Prop({ required: true, default: true })
  interviewReminders!: boolean;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);
