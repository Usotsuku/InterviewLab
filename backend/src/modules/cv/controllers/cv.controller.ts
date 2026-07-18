import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CheckAuth } from '@core/decorators/check-auth.decorator';
import { CurrentUser, JwtPayload } from '@core/decorators/current-user.decorator';
import { CvService } from '../services/cv.service';

@ApiTags('CV')
@Controller('cv')
export class CvController {
  constructor(private readonly _cvService: CvService) {}

  @Post('upload')
  @CheckAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a CV file (PDF only, max 10MB). Triggers AI analysis.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF file' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'CV uploaded and analyzed. Returns analysis status.' })
  @ApiResponse({ status: 400, description: 'INVALID_FILE_TYPE, FILE_TOO_LARGE, or EMPTY_FILE' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async uploadCv(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this._cvService.upload(user.sub, file);
  }

  @Put('upload')
  @CheckAuth()
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Replace an existing CV with a new file. Triggers re-analysis.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF file' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'CV replaced and re-analyzed. Returns analysis status.',
  })
  @ApiResponse({ status: 400, description: 'INVALID_FILE_TYPE, FILE_TOO_LARGE, or EMPTY_FILE' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async replaceCv(@CurrentUser() user: JwtPayload, @UploadedFile() file: Express.Multer.File) {
    return this._cvService.replace(user.sub, file);
  }

  @Get('metadata')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retrieve CV metadata for the authenticated user.' })
  @ApiResponse({ status: 200, description: 'Returns CV metadata.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  @ApiResponse({ status: 404, description: 'CV_NOT_FOUND' })
  async getMetadata(@CurrentUser() user: JwtPayload) {
    return this._cvService.getMetadata(user.sub);
  }

  @Get('status')
  @CheckAuth()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the current CV analysis status.' })
  @ApiResponse({ status: 200, description: 'Returns analysis status.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  async getAnalysisStatus(@CurrentUser() user: JwtPayload) {
    return this._cvService.getAnalysisStatus(user.sub);
  }

  @Delete()
  @CheckAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete the uploaded CV file and clear metadata.' })
  @ApiResponse({ status: 200, description: 'CV deleted successfully.' })
  @ApiResponse({ status: 401, description: 'UNAUTHORIZED_ACCESS' })
  @ApiResponse({ status: 404, description: 'CV_NOT_FOUND' })
  async deleteCv(@CurrentUser() user: JwtPayload) {
    return this._cvService.delete(user.sub);
  }
}
