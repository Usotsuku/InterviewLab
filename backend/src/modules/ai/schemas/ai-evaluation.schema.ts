import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AiEvaluationDocument = HydratedDocument<AiEvaluation>;

@Schema({ collection: 'ai_evaluations', timestamps: true })
export class AiEvaluation {
  @Prop({ type: Types.ObjectId, ref: 'Answer', required: true, index: true })
  answerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Interview', required: true, index: true })
  interviewId!: Types.ObjectId;

  @Prop({ type: Number, default: null })
  technicalScore?: number | null;

  @Prop({ default: null })
  communicationScore?: number;

  @Prop({ default: null })
  correctnessScore?: number;

  @Prop({ default: null })
  completenessScore?: number;

  @Prop({ type: [String], default: [] })
  strengths!: string[];

  @Prop({ type: [String], default: [] })
  weaknesses!: string[];

  @Prop({ type: [String], default: [] })
  missingConcepts!: string[];

  @Prop({ type: [String], default: [] })
  followUpQuestions!: string[];

  @Prop({ default: '' })
  feedback?: string;

  @Prop({ default: '' })
  promptUsed?: string;

  @Prop({ default: '' })
  rawAiResponse?: string;

  @Prop({ default: null })
  tokensUsed?: number;

  @Prop({ default: null })
  evaluationDurationMs?: number;

  @Prop({ default: '' })
  provider?: string;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const AiEvaluationSchema = SchemaFactory.createForClass(AiEvaluation);
