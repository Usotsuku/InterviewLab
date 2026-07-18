import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@core/repository/base.repository';
import { Question, QuestionDocument } from '../schemas/question.schema';

@Injectable()
export class QuestionRepository extends BaseRepository<QuestionDocument> {
  private readonly _logger = new Logger(QuestionRepository.name);
  private _diagDone = false;

  constructor(
    @InjectModel(Question.name) private readonly _questionModel: Model<QuestionDocument>,
  ) {
    super(_questionModel);
  }

  private async _runDiagnostics(interviewId: string | Types.ObjectId): Promise<void> {
    if (this._diagDone) return;
    this._diagDone = true;

    const strId = String(interviewId);
    const colName = this._questionModel.collection.name;
    const dbName = this._questionModel.db.name;

    this._logger.log(
      `[DIAG] collection="${colName}" db="${dbName}" inputType=${typeof interviewId} inputConstructor=${(interviewId as any)?.constructor?.name} input="${strId}"`,
    );

    const all = await this._questionModel.find({}).lean().exec();
    this._logger.log(`[DIAG] find({}) → ${all.length} docs`);

    if (all.length > 0) {
      const s = all[0] as any;
      this._logger.log(
        `[DIAG] sample: _id=${s._id} interviewId=${s.interviewId} interviewIdType=${typeof s.interviewId} interviewIdConstructor=${s.interviewId?.constructor?.name} deletedAt=${s.deletedAt} deletedAtType=${typeof s.deletedAt} deletedAtConstructor=${s.deletedAt?.constructor?.name}`,
      );

      const matchByStr = all.filter((d: any) => String(d.interviewId) === strId);
      this._logger.log(`[DIAG] docs matching interviewId via String() === : ${matchByStr.length}`);
    }

    const r1 = await this._questionModel.find({ interviewId: strId }).lean().exec();
    this._logger.log(`[DIAG] find({ interviewId: "${strId}" }) → ${r1.length} docs (string)`);

    const oid = new Types.ObjectId(strId);
    const r2 = await this._questionModel.find({ interviewId: oid }).lean().exec();
    this._logger.log(`[DIAG] find({ interviewId: ObjectId("${strId}") }) → ${r2.length} docs (ObjectId)`);

    const r3 = await this._questionModel.find({ interviewId: strId }).lean().exec();
    this._logger.log(`[DIAG] find({ interviewId: "${strId}" }) → ${r3.length} docs (toString)`);

    const r4 = await this._questionModel.find({ interviewId: strId, deletedAt: null }).lean().exec();
    this._logger.log(`[DIAG] find({ interviewId: "${strId}", deletedAt: null }) → ${r4.length} docs (with deletedAt)`);

    const r5 = await this._questionModel.find({ interviewId: oid, deletedAt: null }).lean().exec();
    this._logger.log(`[DIAG] find({ interviewId: ObjectId("${strId}"), deletedAt: null }) → ${r5.length} docs (ObjectId + deletedAt)`);

    const r6 = await this._questionModel.find({}).lean().exec();
    this._logger.log(`[DIAG] find({}) second pass → ${r6.length} docs`);
    for (const d of r6) {
      const doc = d as any;
      if (String(doc.interviewId) === strId) {
        this._logger.log(
          `[DIAG] matching doc: _id=${doc._id} interviewId=${doc.interviewId} type=${doc.interviewId?.constructor?.name} deletedAt=${doc.deletedAt}`,
        );
      }
    }
  }

  async findByInterviewId(interviewId: string | Types.ObjectId): Promise<QuestionDocument[]> {
    await this._runDiagnostics(interviewId);

    const filter = { interviewId, deletedAt: null };
    const results = await this._questionModel
      .find(filter)
      .sort({ order: 1 })
      .exec();
    this._logger.debug(`[findByInterviewId] results: ${results.length}`);
    return results;
  }
}
