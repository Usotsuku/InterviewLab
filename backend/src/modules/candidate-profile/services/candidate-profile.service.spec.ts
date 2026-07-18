import { Test, TestingModule } from '@nestjs/testing';
import { CandidateProfileService } from './candidate-profile.service';
import { CandidateProfileRepository } from '../repositories/candidate-profile.repository';
import { Types } from 'mongoose';
import { CvAnalysisStatus } from '@shared/enums/domain.enums';

describe('CandidateProfileService', () => {
  let service: CandidateProfileService;

  const mockProfileRepo = {
    findByUserId: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    softDeleteById: jest.fn(),
  };

  const createMockProfile = (overrides: Record<string, unknown> = {}) => ({
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    summary: '',
    skills: [],
    technologies: [],
    experience: [],
    projects: [],
    strengths: [],
    weaknesses: [],
    cvAnalysisStatus: CvAnalysisStatus.NOT_UPLOADED,
    cvFileUrl: null,
    cvFileName: null,
    cvFileSize: null,
    cvUploadedAt: null,
    ...overrides,
  });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateProfileService,
        { provide: CandidateProfileRepository, useValue: mockProfileRepo },
      ],
    }).compile();

    service = module.get<CandidateProfileService>(CandidateProfileService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('findByUserId', () => {
    it('should return profile with completion percent', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(
        createMockProfile({ summary: 'Full-stack dev', skills: ['TS'] }),
      );

      const result = await service.findByUserId('user1');
      expect(result.summary).toBe('Full-stack dev');
      expect(result.completionPercent).toBe(40);
    });

    it('should throw if profile not found', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(null);
      await expect(service.findByUserId('user1')).rejects.toThrow();
    });
  });

  describe('updateByUserId', () => {
    it('should update existing profile fields', async () => {
      const mockDoc = createMockProfile();
      mockProfileRepo.findByUserId.mockResolvedValue(mockDoc);
      mockProfileRepo.updateById.mockResolvedValue(mockDoc);
      mockProfileRepo.findByUserId.mockResolvedValueOnce(mockDoc).mockResolvedValueOnce(
        createMockProfile({ summary: 'Updated', skills: ['React'] }),
      );

      const result = await service.updateByUserId('user1', { summary: 'Updated', skills: ['React'] });
      expect(result.summary).toBe('Updated');
      expect(result.skills).toEqual(['React']);
    });

    it('should create profile if not found during update', async () => {
      mockProfileRepo.findByUserId.mockResolvedValueOnce(null).mockResolvedValueOnce(
        createMockProfile({ summary: 'New' }),
      );
      mockProfileRepo.create.mockResolvedValue(createMockProfile());

      const result = await service.updateByUserId('user1', { summary: 'New' });
      expect(mockProfileRepo.create).toHaveBeenCalled();
    });
  });

  describe('deleteByUserId', () => {
    it('should soft-delete profile', async () => {
      const mockDoc = createMockProfile();
      mockProfileRepo.findByUserId.mockResolvedValue(mockDoc);
      mockProfileRepo.softDeleteById.mockResolvedValue(true);

      const result = await service.deleteByUserId('user1');
      expect(result.deleted).toBe(true);
    });

    it('should throw if profile not found', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(null);
      await expect(service.deleteByUserId('user1')).rejects.toThrow();
    });
  });

  describe('calculateProfileCompletion', () => {
    it('should return 0 for empty profile', () => {
      const result = service.calculateProfileCompletion({
        summary: '',
        skills: [],
        technologies: [],
        experience: [],
        projects: [],
      });
      expect(result.percent).toBe(0);
    });

    it('should return 100 for complete profile', () => {
      const result = service.calculateProfileCompletion({
        summary: 'Developer',
        skills: ['TS'],
        technologies: ['Node'],
        experience: [{ company: 'Acme' }],
        projects: [{ name: 'Proj' }],
      });
      expect(result.percent).toBe(100);
    });

    it('should return 60 for profile with 3 of 5 fields', () => {
      const result = service.calculateProfileCompletion({
        summary: 'Developer',
        skills: ['TS'],
        technologies: ['Node'],
        experience: [],
        projects: [],
      });
      expect(result.percent).toBe(60);
    });
  });

  describe('hasUploadedCv', () => {
    it('should return true if cvFileUrl exists', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(
        createMockProfile({ cvFileUrl: 'cv/user1/cv.pdf' }),
      );
      expect(await service.hasUploadedCv('user1')).toBe(true);
    });

    it('should return false if no cv', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(createMockProfile());
      expect(await service.hasUploadedCv('user1')).toBe(false);
    });

    it('should return false if profile not found', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(null);
      expect(await service.hasUploadedCv('user1')).toBe(false);
    });
  });

  describe('profileIsComplete', () => {
    it('should return true if all fields filled', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(
        createMockProfile({
          summary: 'Dev',
          skills: ['TS'],
          technologies: ['Node'],
          experience: [{ company: 'A' }],
          projects: [{ name: 'P' }],
        }),
      );
      expect(await service.profileIsComplete('user1')).toBe(true);
    });

    it('should return false if fields missing', async () => {
      mockProfileRepo.findByUserId.mockResolvedValue(createMockProfile());
      expect(await service.profileIsComplete('user1')).toBe(false);
    });
  });
});
