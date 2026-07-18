import { Controller, Get, Patch, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve the active candidate profile with completion percentage.' })
  @ApiResponse({ status: 200, description: 'Returns the candidate profile.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  @ApiResponse({ status: 404, description: 'CANDIDATE_PROFILE_NOT_FOUND' })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this._profileService.findByUserId(user.sub);
  }

  @Patch()
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update candidate profile fields.' })
  @ApiResponse({ status: 200, description: 'Profile updated. Returns the updated profile.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() body: UpdateProfileDto) {
    return this._profileService.updateByUserId(user.sub, body);
  }

  @Delete()
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete the active candidate profile.' })
  @ApiResponse({ status: 200, description: 'Profile deleted.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  @ApiResponse({ status: 404, description: 'CANDIDATE_PROFILE_NOT_FOUND' })
  async deleteProfile(@CurrentUser() user: JwtPayload) {
    return this._profileService.deleteByUserId(user.sub);
  }
}
