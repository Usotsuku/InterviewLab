import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';
import { UserDocument } from '../schemas/user.schema';
import { USERS_ERRORS } from '../users.errors';
import { AppException } from '@core/exceptions/app.exception';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly _usersRepository: UsersRepository) {}

  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this._usersRepository.findById(userId);
    if (!user) {
      AppException.throw(USERS_ERRORS.USER_NOT_FOUND);
    }
    return this._toProfile(user);
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<UserProfile> {
    const existing = await this._usersRepository.findById(userId);
    if (!existing) {
      AppException.throw(USERS_ERRORS.USER_NOT_FOUND);
    }

    const update: { name?: string } = {};
    if (dto.name !== undefined) {
      update.name = dto.name;
    }

    const updated = await this._usersRepository.updateById(userId, update);
    if (!updated) {
      AppException.throw(USERS_ERRORS.USER_NOT_FOUND);
    }
    return this._toProfile(updated);
  }

  private _toProfile(user: UserDocument): UserProfile {
    const doc = user as unknown as { createdAt?: Date };
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: doc.createdAt?.toISOString(),
    };
  }
}
