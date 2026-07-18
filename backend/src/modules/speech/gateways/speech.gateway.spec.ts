import { SpeechGateway } from './speech.gateway';
import { SpeechService, SpeechSession } from '../services/speech.service';
import { SpeechSessionStatus } from '@shared/enums/domain.enums';

describe('SpeechGateway', () => {
  let gateway: SpeechGateway;

  const mockSpeechService: jest.Mocked<SpeechService> = {
    startSession: jest.fn(),
    receiveChunk: jest.fn(),
    finishSession: jest.fn(),
    getSession: jest.fn(),
    storeAudio: jest.fn(),
  } as unknown as jest.Mocked<SpeechService>;

  const mockClient = {
    id: 'client-1',
    emit: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    gateway = new SpeechGateway(mockSpeechService);
    gateway.server = { to: jest.fn().mockReturnThis(), emit: jest.fn() } as any;
  });

  describe('handleStart', () => {
    it('should create a session and emit speech:started', async () => {
      const session: SpeechSession = {
        id: 'speech-q1-123',
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
        chunks: [],
        status: SpeechSessionStatus.ACTIVE,
        transcript: '',
        startedAt: new Date(),
        audioUrl: null,
      };

      mockSpeechService.startSession.mockResolvedValue(session);

      await gateway.handleStart(
        { interviewId: 'int-1', questionId: 'q-1', userId: 'user-1' },
        mockClient,
      );

      expect(mockClient.emit).toHaveBeenCalledWith('speech:started', { sessionId: 'speech-q1-123' });
    });

    it('should emit speech:error on failure', async () => {
      mockSpeechService.startSession.mockRejectedValue(new Error('Session already active'));

      await gateway.handleStart(
        { interviewId: 'int-1', questionId: 'q-1', userId: 'user-1' },
        mockClient,
      );

      expect(mockClient.emit).toHaveBeenCalledWith('speech:error', {
        error: 'Session already active',
      });
    });
  });

  describe('handleChunk', () => {
    it('should delegate to SpeechService.receiveChunk', () => {
      gateway.handleChunk({ sessionId: 's1', chunk: 'abc' }, mockClient);

      expect(mockSpeechService.receiveChunk).toHaveBeenCalledWith('s1', 'abc');
    });

    it('should emit speech:error on chunk failure', () => {
      mockSpeechService.receiveChunk.mockImplementation(() => {
        throw new Error('Invalid session');
      });

      gateway.handleChunk({ sessionId: 's1', chunk: 'abc' }, mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('speech:error', {
        sessionId: 's1',
        error: 'Invalid session',
      });
    });
  });

  describe('handleFinish', () => {
    it('should finalize session and emit speech:completed', async () => {
      const completedSession: SpeechSession = {
        id: 's1',
        interviewId: 'int-1',
        questionId: 'q-1',
        userId: 'user-1',
        chunks: [],
        status: SpeechSessionStatus.COMPLETED,
        transcript: 'Hello world',
        startedAt: new Date(),
        audioUrl: 'audio/int-1/q-1.webm',
      };

      mockSpeechService.finishSession.mockResolvedValue(completedSession);

      await gateway.handleFinish({ sessionId: 's1' }, mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('speech:completed', {
        sessionId: 's1',
        transcript: 'Hello world',
        audioUrl: 'audio/int-1/q-1.webm',
      });
    });

    it('should emit speech:error on finish failure', async () => {
      mockSpeechService.finishSession.mockRejectedValue(new Error('No audio data'));

      await gateway.handleFinish({ sessionId: 's1' }, mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('speech:error', {
        sessionId: 's1',
        error: 'No audio data',
      });
    });
  });

  describe('handleDisconnect', () => {
    it('should clean up client-session mapping', () => {
      (gateway as any)._clientSessions.set('client-1', 'session-1');

      gateway.handleDisconnect(mockClient);

      expect((gateway as any)._clientSessions.has('client-1')).toBe(false);
    });
  });
});
