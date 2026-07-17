import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { CvService } from '../services/cv.service';

@ApiTags('CV')
@Controller('cv')
export class CvController {
  constructor(private readonly _cvService: CvService) {}

  @Post('upload')
  @CheckAuth()
  @ApiOperation({ summary: 'Upload CV file for text extraction and AI parsing.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadCv(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this._cvService.processCv(user.sub, file);
  }
}
