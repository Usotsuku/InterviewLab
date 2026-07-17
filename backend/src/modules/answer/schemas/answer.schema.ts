import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AnswerDocument = HydratedDocument<Answer>;

@Schema({ timestamps: true })
export class Answer {
  @Prop({ type: Types.ObjectId, ref: 'Interview', required: true, index: true })
  interviewId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Question', required: true, index: true })
  questionId!: Types.ObjectId;

  @Prop({ default: '' })
  transcript?: string;

  @Prop({ default: null })
  audioUrl?: string;

  @Prop({ default: null })
  durationSeconds?: number;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const AnswerSchema = SchemaFactory.createForClass(Answer);
