import { Injectable } from '@nestjs/common';
import { Query } from 'mongoose';
import { QueryConfig } from './query-config.types';

@Injectable()
export class QueryService {
  applyConfig<T, Doc>(
    query: Query<T, Doc>,
    config: QueryConfig<Doc>,
  ): Query<T, Doc> {
    if (config.projection) {
      query.select(config.projection);
    }

    if (config.sort) {
      query.sort(config.sort as any);
    }

    if (config.populate) {
      query.populate(config.populate);
    }

    if (config.pagination) {
      const skip = (config.pagination.page - 1) * config.pagination.limit;
      query.skip(skip).limit(config.pagination.limit);
    }

    if (config.options) {
      query.setOptions(config.options);
    }

    return query;
  }
}
