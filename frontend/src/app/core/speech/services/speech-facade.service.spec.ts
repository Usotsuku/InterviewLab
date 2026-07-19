import { TestBed } from '@angular/core/testing';
import { SpeechFacadeService } from './speech-facade.service';
import { SpeechRecognitionService } from './speech-recognition.service';
import { AudioRecorderService } from './audio-recorder.service';
import { TranscriptValidationService } from './transcript-validation.service';
import { SpeechPermissionsService } from './speech-permissions.service';
import { SpeechResult, SpeechState } from '../speech.types';
import { signal } from '@angular/core';

class MockSpeechRecognitionService {
  isListening = signal(false);
  interimTranscript = signal('');
  finalTranscript = signal('');
  recognitionError = signal<{ code: string; message: string } | null>(null);
  isSupported = true;
  onTerminalError?: (code: string, message: string) => void;

  start = jasmine.createSpy('start');
  stop = jasmine.createSpy('stop').and.returnValue(Promise.resolve(''));
  reset = jasmine.createSpy('reset').and.returnValue(Promise.resolve());
}

class MockAudioRecorderService {
  durationMs = signal(0);
  start = jasmine.createSpy('start').and.returnValue(Promise.resolve());
  stop = jasmine.createSpy('stop').and.returnValue(Promise.resolve(new Blob()));
  getAnalyserNode = jasmine.createSpy('getAnalyserNode').and.returnValue(null);
}

class MockTranscriptValidationService {
  validate = jasmine.createSpy('validate').and.returnValue({
    isValid: true,
    wordCount: 0,
    characterCount: 0,
    estimatedDurationAccuracy: true,
    errors: [],
  });
}

class MockSpeechPermissionsService {
  private _state = signal<'UNKNOWN' | 'GRANTED' | 'DENIED' | 'PROMPT'>('GRANTED');
  permissionState = this._state.asReadonly();

  requestPermission = jasmine.createSpy('requestPermission').and.returnValue(Promise.resolve('GRANTED'));
  getStream = jasmine.createSpy('getStream').and.returnValue(Promise.resolve({ getTracks: () => [] }));
}

describe('SpeechFacadeService', () => {
  let facade: SpeechFacadeService;
  let mockRecognition: MockSpeechRecognitionService;
  let mockRecorder: MockAudioRecorderService;
  let mockValidator: MockTranscriptValidationService;
  let mockPermissions: MockSpeechPermissionsService;

  beforeEach(() => {
    mockRecognition = new MockSpeechRecognitionService();
    mockRecorder = new MockAudioRecorderService();
    mockValidator = new MockTranscriptValidationService();
    mockPermissions = new MockSpeechPermissionsService();

    TestBed.configureTestingModule({
      providers: [
        SpeechFacadeService,
        { provide: SpeechRecognitionService, useValue: mockRecognition },
        { provide: AudioRecorderService, useValue: mockRecorder },
        { provide: TranscriptValidationService, useValue: mockValidator },
        { provide: SpeechPermissionsService, useValue: mockPermissions },
      ],
    });

    facade = TestBed.inject(SpeechFacadeService);
  });

  it('should be created', () => {
    expect(facade).toBeTruthy();
  });

  describe('constructor — terminal error propagation (Issue 5)', () => {
    it('should set onTerminalError on recognition service', () => {
      expect(mockRecognition.onTerminalError).toBeDefined();
    });

    it('should transition to ERROR state when terminal error fires during RECORDING', () => {
      (facade as any)._speechState.set('RECORDING');

      mockRecognition.onTerminalError!('audio-capture', 'SPEECH_AUDIO_CAPTURE_FAILED');

      expect(facade.speechState()).toBe('ERROR');
      expect(facade.error()!.code).toBe('RECOGNITION_ERROR');
    });

    it('should NOT transition to ERROR when terminal error fires outside RECORDING', () => {
      (facade as any)._speechState.set('READY');

      mockRecognition.onTerminalError!('audio-capture', 'SPEECH_AUDIO_CAPTURE_FAILED');

      expect(facade.speechState()).toBe('READY');
    });
  });

  describe('stopAnswering()', () => {
    beforeEach(async () => {
      (facade as any)._speechState.set('RECORDING');
      (facade as any)._recorder.durationMs.set(15000);
    });

    it('should snapshot durationSeconds BEFORE teardown', async () => {
      let capturedDuration: number | undefined;

      mockRecorder.durationMs.set(15000);
      mockRecognition.stop.and.callFake(async () => {
        (facade as any)._recorder.durationMs.set(0);
        return 'answer';
      });

      await facade.stopAnswering();

      // Duration should have been captured at 15s, not 0s after teardown
      // Verify by checking the validator received the right duration
      const callArgs = mockValidator.validate.calls.mostRecent().args;
      expect(callArgs[1]).toBe(15);
    });

    it('should await recognition stop()', async () => {
      const stopPromise = facade.stopAnswering();
      expect(mockRecognition.stop).toHaveBeenCalled();
      await stopPromise;
    });

    it('should return transcript from recognition stop()', async () => {
      mockRecognition.stop.and.returnValue(Promise.resolve('test answer'));
      const result = await facade.stopAnswering();
      expect(result.transcript).toBe('test answer');
    });

    it('should transition to COMPLETED when validation passes', async () => {
      await facade.stopAnswering();
      expect(facade.speechState()).toBe('COMPLETED');
    });

    it('should transition to ERROR when validation fails', async () => {
      mockValidator.validate.and.returnValue({
        isValid: false,
        wordCount: 0,
        characterCount: 0,
        estimatedDurationAccuracy: false,
        errors: ['TRANSCRIPT_EMPTY'],
      });

      await facade.stopAnswering();

      expect(facade.speechState()).toBe('ERROR');
      expect(facade.error()!.code).toBe('TRANSCRIPT_EMPTY');
    });

    it('should throw when not recording', async () => {
      (facade as any)._speechState.set('IDLE');
      try {
        await facade.stopAnswering();
        fail('should have thrown');
      } catch (err: any) {
        expect(err.code).toBe('NOT_RECORDING');
      }
    });
  });

  describe('resetForNextQuestion()', () => {
    it('should be async and await recognition reset()', async () => {
      await facade.resetForNextQuestion();
      expect(mockRecognition.reset).toHaveBeenCalled();
    });

    it('should set state to READY', async () => {
      (facade as any)._speechState.set('COMPLETED');
      await facade.resetForNextQuestion();
      expect(facade.speechState()).toBe('READY');
    });

    it('should clear error', async () => {
      (facade as any)._error.set({ code: 'RECOGNITION_ERROR', message: 'fail' } as any);
      await facade.resetForNextQuestion();
      expect(facade.error()).toBeNull();
    });
  });

  describe('destroy()', () => {
    it('should be async and await recognition stop()', async () => {
      await facade.destroy();
      expect(mockRecognition.stop).toHaveBeenCalled();
    });

    it('should set state to IDLE', async () => {
      (facade as any)._speechState.set('RECORDING');
      await facade.destroy();
      expect(facade.speechState()).toBe('IDLE');
    });
  });
});
