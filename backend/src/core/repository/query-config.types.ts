import { FilterQuery, ProjectionType, QueryOptions, PopulateOptions } from 'mongoose';

export interface QueryConfig<T> {
  filter?: FilterQuery<T>;
  projection?: ProjectionType<T>;
  options?: QueryOptions<T>;
  populate?: PopulateOptions | (string | PopulateOptions)[];
  includeDeleted?: boolean;
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: Record<string, 1 | -1 | 'asc' | 'desc'>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
