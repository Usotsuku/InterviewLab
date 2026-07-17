import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';

export type CandidateProfileDocument = HydratedDocument<CandidateProfile>;

@Schema({ _id: false })
export class ExperienceEntry {
  @Prop({ required: true })
  company!: string;

  @Prop({ required: true })
  position!: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ default: null })
  endDate?: Date;

  @Prop({ default: '' })
  description?: string;
}

@Schema({ _id: false })
export class ProjectEntry {
  @Prop({ required: true })
  name!: string;

  @Prop({ default: '' })
  description?: string;

  @Prop({ type: [String], default: [] })
  technologies!: string[];

  @Prop({ default: null })
  url?: string;
}

export const ExperienceEntrySchema = SchemaFactory.createForClass(ExperienceEntry);
export const ProjectEntrySchema = SchemaFactory.createForClass(ProjectEntry);

@Schema({ collection: 'candidate_profiles', timestamps: true })
export class CandidateProfile {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ default: '' })
  summary?: string;

  @Prop({ type: [String], default: [] })
  skills!: string[];

  @Prop({ type: [String], default: [] })
  technologies!: string[];

  @Prop({ type: [ExperienceEntrySchema], default: [] })
  experience!: ExperienceEntry[];

  @Prop({ type: [ProjectEntrySchema], default: [] })
  projects!: ProjectEntry[];

  @Prop({ type: [String], default: [] })
  strengths!: string[];

  @Prop({ type: [String], default: [] })
  weaknesses!: string[];

  @Prop({ required: true, default: CvAnalysisStatus.NOT_UPLOADED, enum: CvAnalysisStatus })
  cvAnalysisStatus!: CvAnalysisStatus;

  @Prop({ default: null })
  deletedAt?: Date;
}

export const CandidateProfileSchema = SchemaFactory.createForClass(CandidateProfile);
