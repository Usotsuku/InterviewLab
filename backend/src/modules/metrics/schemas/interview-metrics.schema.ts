import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InterviewMetricsDocument = HydratedDocument<InterviewMetrics>;

@Schema({ collection: 'interview_metrics', timestamps: true })
export class InterviewMetrics {
  @Prop({ type: Types.ObjectId, ref: 'Answer', required: true, index: true })
  answerId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Interview', required: true, index: true })
  interviewId!: Types.ObjectId;

  @Prop({ default: null })
  wordsPerMinute?: number;

  @Prop({ default: null })
  answerDuration?: number;

  @Prop({ default: null })
  pauseCount?: number;

  @Prop({ default: null })
  averagePause?: number;

  @Prop({ default: null })
  longestPause?: number;

  @Prop({ default: null })
  fillerCount?: number;

  @Prop({ default: null })
  vocabularyRichness?: number;

  @Prop({ default: null })
  repetitionScore?: number;

  @Prop({ default: null })
  keywordCoverage?: number;

  @Prop({ default: null })
  confidenceScore?: number;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const InterviewMetricsSchema = SchemaFactory.createForClass(InterviewMetrics);
