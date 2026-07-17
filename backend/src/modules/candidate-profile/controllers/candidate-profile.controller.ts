import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { CandidateProfileService } from '../services/candidate-profile.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';

@ApiTags('Candidate Profile')
@Controller('candidate-profile')
export class CandidateProfileController {
  constructor(private readonly _profileService: CandidateProfileService) {}

  @Get()
  @CheckAuth()
  @ApiOperation({ summary: 'Retrieve the active candidate CV analysis profile.' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this._profileService.findByUserId(user.sub);
  }

  @Patch()
  @CheckAuth()
  @ApiOperation({ summary: 'Update candidate background meta-parameters.' })
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() body: UpdateProfileDto) {
    return this._profileService.updateByUserId(user.sub, body);
  }
}
