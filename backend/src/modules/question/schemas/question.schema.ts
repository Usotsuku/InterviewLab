import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';
import { QuestionType, QuestionDifficulty } from '@shared/enums/domain.enums';

export type QuestionDocument = HydratedDocument<Question>;

@Schema({ timestamps: true })
export class Question {
  @Prop({ type: Types.ObjectId, ref: 'Interview', required: true, index: true })
  interviewId!: Types.ObjectId;

  @Prop({ required: true })
  text!: string;

  @Prop({ required: true, enum: QuestionType })
  type!: QuestionType;

  @Prop({ required: true, default: QuestionDifficulty.MEDIUM, enum: QuestionDifficulty })
  difficulty!: QuestionDifficulty;

  @Prop({ required: true })
  order!: number;

  @Prop({ type: [String], default: [] })
  targetSkills?: string[];

  @Prop({ type: [String], default: [] })
  generatedFrom?: string[];

  @Prop({ type: [String], default: [] })
  expectedKeywords?: string[];

  @Prop({ default: null })
  estimatedAnswerDuration?: number;

  @Prop({ type: MongooseSchema.Types.Mixed, default: null })
  metadata?: Record<string, unknown>;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const QuestionSchema = SchemaFactory.createForClass(Question);
