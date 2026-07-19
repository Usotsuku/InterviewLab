import { TestBed } from '@angular/core/testing';
import { SpeechRecognitionService } from './speech-recognition.service';
import { SpeechError } from '../speech.types';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  lang = '';

  onresult: ((event: SpeechRecognitionEvent) => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null = null;

  start = jasmine.createSpy('start');
  stop = jasmine.createSpy('stop');
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMockEvent(results: MockResult[], resultIndex = 0): SpeechRecognitionEvent {
  return { results, resultIndex } as unknown as SpeechRecognitionEvent;
}

interface MockResult {
  isFinal: boolean;
  0: { transcript: string };
}

function makeResult(transcript: string, isFinal: boolean): MockResult {
  return { isFinal, 0: { transcript } };
}

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let mockInstance: MockSpeechRecognition;

  beforeEach(() => {
    mockInstance = new MockSpeechRecognition();
    const SpyCtor = function () {
      return mockInstance;
    } as unknown as typeof MockSpeechRecognition;
    SpyCtor.prototype = MockSpeechRecognition.prototype;
    (window as any).SpeechRecognition = SpyCtor;

    TestBed.configureTestingModule({});
    service = TestBed.inject(SpeechRecognitionService);
  });

  afterEach(() => {
    delete (window as any).SpeechRecognition;
    delete (window as any).webkitSpeechRecognition;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when SpeechRecognition is on window', () => {
      expect(service.isSupported).toBeTrue();
    });

    it('should return false when neither SpeechRecognition nor webkitSpeechRecognition exists', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      const svc = new SpeechRecognitionService();
      expect(svc.isSupported).toBeFalse();
    });
  });

  describe('start()', () => {
    it('should throw NOT_SUPPORTED when unsupported', () => {
      delete (window as any).SpeechRecognition;
      delete (window as any).webkitSpeechRecognition;
      const svc = new SpeechRecognitionService();
      try {
        svc.start('en-US');
        fail('should have thrown');
      } catch (e) {
        expect(e instanceof SpeechError).toBeTrue();
        expect((e as SpeechError).code).toBe('NOT_SUPPORTED');
      }
    });

    it('should set isListening to true after start', () => {
      service.start('en-US');
      expect(service.isListening()).toBeTrue();
    });

    it('should create recognition with correct config', () => {
      service.start('en-US');
      expect(mockInstance.continuous).toBeTrue();
      expect(mockInstance.interimResults).toBeTrue();
      expect(mockInstance.maxAlternatives).toBe(1);
      expect(mockInstance.lang).toBe('en-US');
    });

    it('should not start again if already listening', () => {
      service.start('en-US');
      mockInstance.start.calls.reset();
      service.start('en-US');
      expect(mockInstance.start).not.toHaveBeenCalled();
    });

    it('should clear state on start', () => {
      service.start('en-US');
      expect(service.finalTranscript()).toBe('');
      expect(service.interimTranscript()).toBe('');
      expect(service.recognitionError()).toBeNull();
    });
  });

  describe('stop()', () => {
    beforeEach(() => {
      service.start('en-US');
      mockInstance.start.calls.reset();
    });

    it('should return a Promise', () => {
      const result = service.stop();
      expect(result instanceof Promise).toBeTrue();
    });

    it('should resolve with empty transcript when no results', async () => {
      const promise = service.stop();
      mockInstance.onend?.();
      const transcript = await promise;
      expect(transcript).toBe('');
      expect(service.isListening()).toBeFalse();
    });

    it('should flush interim results into final transcript', async () => {
      mockInstance.onresult?.(createMockEvent([makeResult('hello world', false)]));
      expect(service.interimTranscript()).toBe('hello world');
      expect(service.finalTranscript()).toBe('');

      const promise = service.stop();
      mockInstance.onend?.();
      const transcript = await promise;

      expect(transcript).toBe('hello world');
      expect(service.interimTranscript()).toBe('');
    });

    it('should resolve immediately when not listening', async () => {
      service.start('en-US');
      mockInstance.onend?.();
      await wait(0);
      mockInstance.stop.calls.reset();

      const transcript = await service.stop();
      expect(transcript).toBe('');
    });

    it('should prevent auto-restart after stop() is called', async () => {
      mockInstance.start.calls.reset();
      const promise = service.stop();

      mockInstance.onend?.();

      expect(mockInstance.start).not.toHaveBeenCalled();
      await promise;
    });

    it('should resolve after timeout even if onend never fires', async () => {
      const promise = service.stop();
      expect(mockInstance.stop).toHaveBeenCalled();

      await wait(600);
      const transcript = await promise;
      expect(transcript).toBe('');
      expect(service.isListening()).toBeFalse();
    });
  });

  describe('onend auto-restart (Issue 2)', () => {
    beforeEach(() => {
      service.start('en-US');
      mockInstance.start.calls.reset();
    });

    it('should auto-restart when onend fires while listening (Chrome ~60s)', () => {
      mockInstance.onend?.();
      expect(mockInstance.start).toHaveBeenCalled();
    });

    it('should NOT auto-restart when _stopping is true', async () => {
      const promise = service.stop();
      mockInstance.onend?.();
      expect(mockInstance.start).not.toHaveBeenCalled();
      await promise;
    });
  });

  describe('interim flush (Issue 1 / Issue 6)', () => {
    beforeEach(() => {
      service.start('en-US');
    });

    it('should move interim into final on stop()', async () => {
      mockInstance.onresult?.(createMockEvent([makeResult('partial', false)]));
      expect(service.interimTranscript()).toBe('partial');

      const promise = service.stop();
      mockInstance.onend?.();
      const transcript = await promise;

      expect(transcript).toBe('partial');
      expect(service.interimTranscript()).toBe('');
    });

    it('should preserve already-final results and append flushed interim', async () => {
      mockInstance.onresult?.(createMockEvent([makeResult('confirmed word.', true)]));
      expect(service.finalTranscript()).toBe('confirmed word.');

      mockInstance.onresult?.(createMockEvent([makeResult('new thought', false)]));

      const promise = service.stop();
      mockInstance.onend?.();
      const transcript = await promise;

      expect(transcript).toBe('confirmed word. new thought');
    });
  });

  describe('terminal error callback (Issue 5)', () => {
    beforeEach(() => {
      service.start('en-US');
    });

    it('should call onTerminalError for non-no-speech errors', () => {
      const callback = jasmine.createSpy('onTerminalError');
      service.onTerminalError = callback;

      mockInstance.onerror?.({ error: 'audio-capture' } as SpeechRecognitionErrorEvent);

      expect(callback).toHaveBeenCalledWith('audio-capture', 'SPEECH_AUDIO_CAPTURE_FAILED');
      expect(service.isListening()).toBeFalse();
    });

    it('should NOT call onTerminalError for no-speech errors', () => {
      const callback = jasmine.createSpy('onTerminalError');
      service.onTerminalError = callback;

      mockInstance.onerror?.({ error: 'no-speech' } as SpeechRecognitionErrorEvent);

      expect(callback).not.toHaveBeenCalled();
      expect(service.isListening()).toBeTrue();
    });

    it('should NOT call onTerminalError when not listening', async () => {
      const promise = service.stop();
      mockInstance.onend?.();
      await promise;

      const callback = jasmine.createSpy('onTerminalError');
      service.onTerminalError = callback;

      mockInstance.onerror?.({ error: 'not-allowed' } as SpeechRecognitionErrorEvent);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('should be async and clear all state', async () => {
      service.start('en-US');
      mockInstance.onresult?.(createMockEvent([makeResult('hello', true)]));

      await service.reset();

      expect(service.isListening()).toBeFalse();
      expect(service.finalTranscript()).toBe('');
      expect(service.interimTranscript()).toBe('');
      expect(service.recognitionError()).toBeNull();
    });
  });
});
