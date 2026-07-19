import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';
import { USERS_ERRORS } from '../users.errors';
import { AppException } from '@core/exceptions/app.exception';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  @Get('me')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve active user profile data.' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this._usersService.getUserProfile(user.sub);
  }

  @Patch(':id')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user settings/metadata profile.' })
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
  ) {
    this._assertSelf(id, user);
    return this._usersService.updateProfile(id, body);
  }

  private _assertSelf(id: string, user: JwtPayload): void {
    if (id !== user.sub) {
      AppException.throw(USERS_ERRORS.PROFILE_ACCESS_DENIED);
    }
  }
}
