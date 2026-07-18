import { Test, TestingModule } from '@nestjs/testing';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { CvController } from './controllers/cv.controller';
import { CvService } from './services/cv.service';
import { StorageService } from '@modules/storage/services/storage.service';
import { CandidateProfileService } from '@modules/candidate-profile/services/candidate-profile.service';
import { PdfExtractionService } from './services/pdf-extraction.service';
import { CvAnalysisService } from './services/cv-analysis.service';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';
import multipart from '@fastify/multipart';

const JWT_SECRET = 'test-secret';

function buildMultipart(boundary: string, parts: string): { payload: string; headers: Record<string, string> } {
  return {
    payload: parts,
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
  };
}

describe('CV upload — Fastify multipart integration', () => {
  let app: NestFastifyApplication;
  let authHeaders: Record<string, string>;
  const mockStorage = {
    store: jest.fn().mockResolvedValue('cv/test-user/test-user_cv.pdf'),
    getFullPath: jest.fn().mockResolvedValue('/uploads/cv/test-user/test-user_cv.pdf'),
    deleteFile: jest.fn().mockResolvedValue(undefined),
  };
  const mockProfile = {
    findByUserId: jest.fn().mockResolvedValue(null),
    updateCvMetadata: jest.fn().mockResolvedValue(undefined),
    clearCvMetadata: jest.fn().mockResolvedValue(undefined),
    findOrCreateByUserId: jest.fn().mockResolvedValue({ cvAnalysisStatus: 'NOT_UPLOADED' }),
  };
  const mockPdf = { extractText: jest.fn().mockResolvedValue('extracted text') };
  const mockAnalysis = {
    analyze: jest.fn().mockResolvedValue({
      status: CvAnalysisStatus.COMPLETED,
      profile: {
        summary: '', skills: [], technologies: [], strengths: [], weaknesses: [], experience: [], projects: [],
      },
    }),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '1h' } }),
      ],
      controllers: [CvController],
      providers: [
        CvService,
        { provide: StorageService, useValue: mockStorage },
        { provide: CandidateProfileService, useValue: mockProfile },
        { provide: PdfExtractionService, useValue: mockPdf },
        { provide: CvAnalysisService, useValue: mockAnalysis },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.register(multipart, { limits: { fileSize: 200 }, throwFileSizeLimit: false });
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const token = new JwtService({ secret: JWT_SECRET }).sign({ sub: 'test-user', email: 'test@example.com' });
    authHeaders = { authorization: `Bearer ${token}` };
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('accepts a multipart PDF, reaches the service, and returns 201', async () => {
    const boundary = '----validboundary';
    const pdf = '%PDF-1.4\n minimal pdf content for testing';
    const { payload, headers } = buildMultipart(
      boundary,
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="test-cv.pdf"\r\n` +
        `Content-Type: application/pdf\r\n\r\n` +
        `${pdf}\r\n` +
        `--${boundary}--\r\n`,
    );

    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'POST',
      url: '/cv/upload',
      payload,
      headers: { ...headers, ...authHeaders },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.payload);
    expect(body.fileName).toBe('test-cv.pdf');
    expect(mockStorage.store).toHaveBeenCalledTimes(1);
    const stored = mockStorage.store.mock.calls[0][0] as Buffer;
    expect(stored.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(mockAnalysis.analyze).toHaveBeenCalledTimes(1);
  });

  it('returns 401 when no bearer token is supplied', async () => {
    const boundary = '----nohdr';
    const pdf = '%PDF-1.4\n content';
    const { payload, headers } = buildMultipart(
      boundary,
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="x.pdf"\r\n` +
        `Content-Type: application/pdf\r\n\r\n` +
        `${pdf}\r\n` +
        `--${boundary}--\r\n`,
    );

    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'POST',
      url: '/cv/upload',
      payload,
      headers,
    });

    expect(res.statusCode).toBe(401);
  });

  it('returns 400 EMPTY_FILE when no file part is present', async () => {
    const boundary = '----emptyboundary';
    const { payload, headers } = buildMultipart(
      boundary,
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="note"\r\n\r\nnot-a-file\r\n` +
        `--${boundary}--\r\n`,
    );

    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'POST',
      url: '/cv/upload',
      payload,
      headers: { ...headers, ...authHeaders },
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.payload).message).toBe('EMPTY_FILE');
  });

  it('returns 400 FILE_TOO_LARGE when the multipart limit is exceeded', async () => {
    const boundary = '----bigboundary';
    const big = '%PDF-1.4\n' + 'x'.repeat(500);
    const { payload, headers } = buildMultipart(
      boundary,
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="big.pdf"\r\n` +
        `Content-Type: application/pdf\r\n\r\n` +
        `${big}\r\n` +
        `--${boundary}--\r\n`,
    );

    const res = await app.getHttpAdapter().getInstance().inject({
      method: 'POST',
      url: '/cv/upload',
      payload,
      headers: { ...headers, ...authHeaders },
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.payload).message).toBe('FILE_TOO_LARGE');
  });
});
