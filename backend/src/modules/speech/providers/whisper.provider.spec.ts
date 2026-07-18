import { WhisperProvider } from './whisper.provider';
import { ConfigService } from '@nestjs/config';

describe('WhisperProvider', () => {
  let provider: WhisperProvider;

  const mockConfig: jest.Mocked<ConfigService> = {
    get: jest.fn((key: string) => {
      if (key === 'SPEECH_PROVIDER_API_KEY') return 'test-api-key';
      if (key === 'SPEECH_PROVIDER_API_URL') return 'https://api.openai.com/v1/audio/transcriptions';
      return undefined;
    }),
  } as unknown as jest.Mocked<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
    provider = new WhisperProvider(mockConfig);
  });

  describe('constructor', () => {
    it('should set name to whisper', () => {
      expect(provider.name).toBe('whisper');
    });
  });

  describe('healthCheck', () => {
    it('should return true when API key is configured', async () => {
      const result = await provider.healthCheck();
      expect(result).toBe(true);
    });

    it('should return false when no API key is configured', async () => {
      const noKeyConfig = {
        get: jest.fn().mockReturnValue(undefined),
      } as unknown as jest.Mocked<ConfigService>;
      const p = new WhisperProvider(noKeyConfig);

      const result = await p.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('transcribe', () => {
    it('should call Whisper API and return transcription result', async () => {
      const mockResponse = {
        text: 'Hello, I have five years of experience',
        language: 'en',
        duration: 3.5,
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse),
      });

      const result = await provider.transcribe({
        audioBuffer: Buffer.from('fake-audio-data'),
        mimeType: 'audio/webm',
      });

      expect(result.text).toBe('Hello, I have five years of experience');
      expect(result.language).toBe('en');
      expect(result.durationMs).toBe(3500);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should throw on non-OK response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue('Unauthorized'),
      });

      await expect(
        provider.transcribe({
          audioBuffer: Buffer.from('data'),
          mimeType: 'audio/webm',
        }),
      ).rejects.toThrow('Whisper API returned status 401');
    });
  });
});
