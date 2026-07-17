import { Injectable } from '@nestjs/common';
import { Express.Multer.File } from 'multer';

interface ProcessCvResponse {
  message: string;
  userId: string;
  fileName: string;
  status: string;
}

@Injectable()
export class CvService {
  async processCv(userId: string, file: File | Express.Multer.File | undefined): Promise<ProcessCvResponse> {
    // TODO: implement storage parsing, text extraction, triggering AI analysis
    const multerFile = file as Express.Multer.File | undefined;
    return {
      message: 'CV uploaded successfully. Analysis queued.',
      userId,
      fileName: multerFile?.originalname ?? 'cv.pdf',
      status: 'PENDING',
    };
  }
}
