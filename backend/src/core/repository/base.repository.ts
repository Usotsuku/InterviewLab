import { Model, FilterQuery, UpdateQuery, Types } from 'mongoose';
import { QueryConfig, PaginatedResult } from './query-config.types';
import { QueryService } from './query.service';

export abstract class BaseRepository<T> {
  protected readonly _queryService = new QueryService();

  constructor(protected readonly _model: Model<T>) {}

  async findAll(config: QueryConfig<T> = {}): Promise<PaginatedResult<T>> {
    const baseFilter = this._buildBaseFilter(config.includeDeleted);
    const filter = { ...baseFilter, ...config.filter };

    const total = await this._model.countDocuments(filter as any).exec();

    const query = this._model.find(filter as any);
    this._queryService.applyConfig(query, config);
    const data = await query.exec();

    const page = config.pagination?.page || 1;
    const limit = config.pagination?.limit || data.length || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data: data as T[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(id: string, config: Omit<QueryConfig<T>, 'filter'> = {}): Promise<T | null> {
    const baseFilter = this._buildBaseFilter(config.includeDeleted);
    const query = this._model.findOne({ _id: id, ...baseFilter } as any);
    this._queryService.applyConfig(query, config);
    return query.exec() as any;
  }

  async findOne(
    filter: FilterQuery<T>,
    config: Omit<QueryConfig<T>, 'filter'> = {},
  ): Promise<T | null> {
    const baseFilter = this._buildBaseFilter(config.includeDeleted);
    const query = this._model.findOne({ ...filter, ...baseFilter } as any);
    this._queryService.applyConfig(query, config);
    return query.exec() as any;
  }

  async create(data: Partial<T>): Promise<T> {
    const created = new this._model(data);
    const doc = await created.save();
    return doc.toObject() as any;
  }

  async updateById(id: string, data: UpdateQuery<T>): Promise<T | null> {
    const baseFilter = this._buildBaseFilter(false);
    return this._model
      .findOneAndUpdate({ _id: id, ...baseFilter } as any, data, { new: true })
      .exec() as any;
  }

  async softDeleteById(id: string): Promise<boolean> {
    const res = await this._model
      .updateOne({ _id: id } as any, { deletedAt: new Date() } as any)
      .exec();
    return res.modifiedCount > 0;
  }

  protected _toObjectId(value: string | Types.ObjectId): Types.ObjectId {
    return value instanceof Types.ObjectId ? value : new Types.ObjectId(value);
  }

  protected _buildBaseFilter(includeDeleted = false): FilterQuery<T> {
    if (includeDeleted) return {};
    return { deletedAt: null };
  }
}
