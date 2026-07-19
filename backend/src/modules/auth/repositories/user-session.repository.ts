import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { QueryService } from '@core/repository/query.service';
import { UserSession, UserSessionDocument } from '../schemas/user-session.schema';

@Injectable()
export class UserSessionRepository extends BaseRepository<UserSessionDocument> {
  constructor(
    @InjectModel(UserSession.name) private readonly _sessionModel: Model<UserSessionDocument>,
    queryService: QueryService,
  ) {
    super(_sessionModel, queryService);
  }

  async findActiveByUserId(userId: string | Types.ObjectId): Promise<UserSessionDocument[]> {
    return this._sessionModel
      .find({
        userId,
        isValid: true,
        expiresAt: { $gt: new Date() },
        deletedAt: null,
      })
      .exec();
  }

  async invalidateSession(sessionId: string): Promise<boolean> {
    const result = await this._sessionModel
      .updateOne({ _id: sessionId }, { isValid: false })
      .exec();
    return result.modifiedCount > 0;
  }

  async invalidateAllByUserId(userId: string | Types.ObjectId): Promise<number> {
    const result = await this._sessionModel
      .updateMany({ userId, isValid: true }, { isValid: false })
      .exec();
    return result.modifiedCount;
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<UserSessionDocument | null> {
    return this._sessionModel
      .findOne({
        refreshToken: refreshTokenHash,
        isValid: true,
        expiresAt: { $gt: new Date() },
        deletedAt: null,
      })
      .exec();
  }
}
