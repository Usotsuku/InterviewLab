import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'ownership';

export const Ownership = (field: string) => SetMetadata(OWNERSHIP_KEY, field);
