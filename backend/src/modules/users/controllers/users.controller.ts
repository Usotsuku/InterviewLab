import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { UsersService } from '../services/users.service';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly _usersService: UsersService) {}

  @Get('me')
  @CheckAuth()
  @ApiOperation({ summary: 'Retrieve active user profile data.' })
  async getMe(@CurrentUser() user: JwtPayload) {
    return this._usersService.getUserProfile(user.sub);
  }

  @Patch(':id')
  @CheckAuth()
  @ApiOperation({ summary: 'Update user settings/metadata profile.' })
  async updateProfile(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this._usersService.updateProfile(id, body);
  }
}
