import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SpeechService } from '../services/speech.service';
import { JwtPayload } from '@core/decorators/current-user.decorator';

interface SpeechStartPayload {
  interviewId: string;
  questionId: string;
  userId: string;
}

interface SpeechChunkPayload {
  sessionId: string;
  chunk: string;
}

interface SpeechFinishPayload {
  sessionId: string;
}

const SPEECH_CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:4200'];

@WebSocketGateway({
  cors: { origin: SPEECH_CORS_ORIGIN },
  namespace: '/speech',
})
export class SpeechGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly _logger = new Logger(SpeechGateway.name);
  private readonly _clientSessions = new Map<string, string>();

  constructor(
    private readonly _speechService: SpeechService,
    private readonly _jwtService: JwtService,
  ) {}

  handleConnection(client: Socket): void {
    try {
      const token = this._extractToken(client);
      if (!token) {
        client.disconnect(true);
        return;
      }
      const payload = this._jwtService.verify<JwtPayload>(token);
      (client.data as { userId?: string }).userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('speech:start')
  async handleStart(
    @MessageBody() payload: SpeechStartPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this._logger.log(`[speech:start] Client ${client.id}`);

    try {
      const userId = (client.data as { userId?: string })?.userId ?? payload.userId;
      const session = await this._speechService.startSession({
        interviewId: payload.interviewId,
        questionId: payload.questionId,
        userId,
      });

      this._clientSessions.set(client.id, session.id);
      client.emit('speech:started', { sessionId: session.id });
    } catch (error) {
      this._logger.error(`[speech:start] Error for client ${client.id}`, error);
      client.emit('speech:error', {
        error: (error as Error).message || 'Failed to start speech session',
      });
    }
  }

  @SubscribeMessage('speech:chunk')
  handleChunk(@MessageBody() payload: SpeechChunkPayload, @ConnectedSocket() client: Socket): void {
    try {
      this._speechService.receiveChunk(payload.sessionId, payload.chunk);
    } catch (error) {
      this._logger.error(`[speech:chunk] Error for session ${payload.sessionId}`, error);
      client.emit('speech:error', {
        sessionId: payload.sessionId,
        error: (error as Error).message || 'Failed to process audio chunk',
      });
    }
  }

  @SubscribeMessage('speech:finish')
  async handleFinish(
    @MessageBody() payload: SpeechFinishPayload,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    this._logger.log(`[speech:finish] Session ${payload.sessionId}`);

    try {
      const session = await this._speechService.finishSession(payload.sessionId);
      client.emit('speech:completed', {
        sessionId: session.id,
        transcript: session.transcript,
        audioUrl: session.audioUrl,
      });
    } catch (error) {
      this._logger.error(`[speech:finish] Error for session ${payload.sessionId}`, error);
      client.emit('speech:error', {
        sessionId: payload.sessionId,
        error: (error as Error).message || 'Failed to finalize speech session',
      });
    }
  }

  handleDisconnect(client: Socket): void {
    const sessionId = this._clientSessions.get(client.id);
    if (sessionId) {
      this._logger.log(`[disconnect] Cleaning up session ${sessionId} for client ${client.id}`);
      this._clientSessions.delete(client.id);
    }
  }

  private _extractToken(client: Socket): string | null {
    const auth = (client.handshake.auth as { token?: string } | undefined)?.token;
    if (auth) {
      return auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : auth;
    }
    const header = client.handshake.headers['authorization'];
    if (!header) return null;
    const [type, token] = header.split(' ');
    return type === 'Bearer' ? token : null;
  }
}
