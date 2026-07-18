import { Test, TestingModule } from '@nestjs/testing';
import { CvAnalysisService } from './cv-analysis.service';
import { PdfExtractionService } from './pdf-extraction.service';
import { AIService } from '@modules/ai/services/ai.service';
import { PromptService } from '@modules/ai/services/prompt.service';
import { CandidateProfileService } from '@modules/candidate-profile/services/candidate-profile.service';
import { NotificationService } from '@modules/notification/services/notification.service';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';

describe('CvAnalysisService', () => {
  let service: CvAnalysisService;

  const mockPdfExtractionService = {
    extractText: jest.fn(),
    validateDocument: jest.fn(),
  };

  const mockAiService = {
    generate: jest.fn(),
  };

  const mockPromptService = {
    buildCvPrompt: jest.fn().mockReturnValue({
      prompt: 'Analyze CV...',
      systemInstruction: 'You are a CV analyst.',
    }),
  };

  const mockCandidateProfileService = {
    updateCvAnalysisStatus: jest.fn().mockResolvedValue(undefined),
    updateByUserId: jest.fn().mockResolvedValue(undefined),
    findByUserId: jest.fn(),
  };

  const mockNotificationService = {
    notifyCvAnalysisComplete: jest.fn().mockResolvedValue(undefined),
  };

  const validAiResponse = JSON.stringify({
    summary: 'Experienced developer',
    skills: ['JavaScript', 'TypeScript'],
    technologies: ['React', 'Node.js'],
    strengths: ['Problem solving'],
    weaknesses: ['Public speaking'],
    experience: [
      {
        company: 'Tech Corp',
        position: 'Developer',
        startDate: '2020-01-01',
        endDate: '2023-12-31',
        description: 'Built stuff',
      },
    ],
    projects: [
      {
        name: 'Project X',
        description: 'A cool project',
        technologies: ['React'],
        url: 'https://github.com/example',
      },
    ],
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvAnalysisService,
        { provide: PdfExtractionService, useValue: mockPdfExtractionService },
        { provide: AIService, useValue: mockAiService },
        { provide: PromptService, useValue: mockPromptService },
        { provide: CandidateProfileService, useValue: mockCandidateProfileService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<CvAnalysisService>(CvAnalysisService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('analyze', () => {
    it('should run the full analysis pipeline successfully', async () => {
      mockPdfExtractionService.extractText.mockResolvedValue('John Doe - Software Engineer');
      mockAiService.generate.mockResolvedValue({
        text: validAiResponse,
        tokenUsage: { input: 100, output: 200 },
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        durationMs: 5000,
      });

      const result = await service.analyze('user1', Buffer.from('pdf content'));

      expect(result.status).toBe(CvAnalysisStatus.COMPLETED);
      expect(result.profile).not.toBeNull();
      expect(result.profile!.summary).toBe('Experienced developer');
      expect(result.profile!.skills).toEqual(['JavaScript', 'TypeScript']);

      expect(mockCandidateProfileService.updateCvAnalysisStatus).toHaveBeenCalledWith('user1', CvAnalysisStatus.PROCESSING);
      expect(mockCandidateProfileService.updateCvAnalysisStatus).toHaveBeenCalledWith('user1', CvAnalysisStatus.COMPLETED);
      expect(mockCandidateProfileService.updateByUserId).toHaveBeenCalledWith('user1', {
        summary: 'Experienced developer',
        skills: ['JavaScript', 'TypeScript'],
        technologies: ['React', 'Node.js'],
        strengths: ['Problem solving'],
        weaknesses: ['Public speaking'],
      });
      expect(mockNotificationService.notifyCvAnalysisComplete).toHaveBeenCalledWith('user1');
    });

    it('should set FAILED status when extraction fails', async () => {
      mockPdfExtractionService.extractText.mockRejectedValue(new Error('Extraction failed'));

      const result = await service.analyze('user1', Buffer.from('bad pdf'));

      expect(result.status).toBe(CvAnalysisStatus.FAILED);
      expect(result.profile).toBeNull();
      expect(mockCandidateProfileService.updateCvAnalysisStatus).toHaveBeenCalledWith('user1', CvAnalysisStatus.FAILED);
    });

    it('should set FAILED status when AI generates invalid response', async () => {
      mockPdfExtractionService.extractText.mockResolvedValue('Valid text');
      mockAiService.generate.mockResolvedValue({
        text: 'not valid json',
        tokenUsage: { input: 10, output: 5 },
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        durationMs: 1000,
      });

      const result = await service.analyze('user1', Buffer.from('pdf'));

      expect(result.status).toBe(CvAnalysisStatus.FAILED);
      expect(result.profile).toBeNull();
    });

    it('should still return COMPLETED if notification fails', async () => {
      mockPdfExtractionService.extractText.mockResolvedValue('Valid text');
      mockAiService.generate.mockResolvedValue({
        text: validAiResponse,
        tokenUsage: { input: 10, output: 20 },
        provider: 'gemini',
        model: 'gemini-1.5-pro',
        durationMs: 1000,
      });
      mockNotificationService.notifyCvAnalysisComplete.mockRejectedValue(new Error('notif error'));

      const result = await service.analyze('user1', Buffer.from('pdf'));

      expect(result.status).toBe(CvAnalysisStatus.COMPLETED);
      expect(result.profile).not.toBeNull();
    });
  });
});
