import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { InterviewMode, InterviewStatus } from '@shared/enums/domain.enums';

export type InterviewDocument = HydratedDocument<Interview>;

@Schema({ timestamps: true })
export class Interview {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: InterviewMode })
  mode!: InterviewMode;

  @Prop({ required: true, default: InterviewStatus.CREATED, enum: InterviewStatus, index: true })
  status!: InterviewStatus;

  @Prop({ default: '' })
  title?: string;

  @Prop({ default: 0 })
  estimatedDuration?: number;

  @Prop({ default: 0 })
  currentQuestionIndex?: number;

  @Prop({ default: 0 })
  totalQuestions?: number;

  @Prop({ default: null })
  overallScore?: number;

  @Prop({ default: null })
  communicationScore?: number;

  @Prop({ default: null })
  technicalScore?: number;

  @Prop({ default: null })
  confidenceScore?: number;

  @Prop({ default: null })
  startedAt?: Date;

  @Prop({ default: null })
  completedAt?: Date;

  @Prop({ default: null })
  actualDurationSeconds?: number;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);
