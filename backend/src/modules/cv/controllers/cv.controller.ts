import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
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
import { AppException } from '@core/exceptions/app.exception';
import { CvService, UploadedCvFile } from '../services/cv.service';
import { CV_ERRORS } from '../errors/cv.errors';

@ApiTags('CV')
@Controller('cv')
export class CvController {
  constructor(private readonly _cvService: CvService) {}

  @Post('upload')
  @CheckAuth()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
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
  async uploadCv(@CurrentUser() user: JwtPayload, @Req() request: FastifyRequest) {
    const file = await this._extractFile(request);
    return this._cvService.upload(user.sub, file);
  }

  @Put('upload')
  @CheckAuth()
  @ApiBearerAuth()
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
  async replaceCv(@CurrentUser() user: JwtPayload, @Req() request: FastifyRequest) {
    const file = await this._extractFile(request);
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

  private async _extractFile(request: FastifyRequest): Promise<UploadedCvFile> {
    const part = await request.file();
    if (!part) {
      throw AppException.throw(CV_ERRORS.EMPTY_FILE);
    }

    const buffer = await part.toBuffer();
    if (part.file.truncated) {
      throw AppException.throw(CV_ERRORS.FILE_TOO_LARGE);
    }

    return {
      buffer,
      originalname: part.filename,
      mimetype: part.mimetype,
      size: buffer.length,
    };
  }
}
