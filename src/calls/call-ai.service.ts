import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import WebSocket, { type RawData } from 'ws';
import { EventEmitter } from 'node:events';

type Source = 'frame' | 'audio';
interface Pending { source: Source; sessionId: string; }
export interface Translation { source: Source; callRoomIdx: number; sessionId: string; text: string }

@Injectable()
export class CallAiService implements OnModuleInit, OnModuleDestroy {
  private socket?: WebSocket;
  private timer?: NodeJS.Timeout;
  private attempts = 0;
  private stopping = false;
  private readonly sessions = new Map<number, Pending>();
  private readonly events = new EventEmitter();

  constructor(private readonly config: ConfigService, private readonly logger: Logger) {}
  onModuleInit(): void { this.connect(); }

  onTranslation(listener: (translation: Translation) => void): () => void {
    this.events.on('translation', listener);
    return () => { this.events.off('translation', listener); };
  }

  send(source: Source, callRoomIdx: number, content: unknown, sessionId: string): { accepted: boolean } {
    if (this.socket?.readyState !== WebSocket.OPEN) {
      return { accepted: false };
    }

    this.sessions.set(callRoomIdx, { source, sessionId });

    this.socket.send(
      JSON.stringify({ [source]: content, callRoomIdx }),
      (error) => {
        if (!error) return;

        this.logger.error({ err: error }, 'AI WebSocket send failed');
        this.socket?.terminate();
      },
    );

    return { accepted: true };
  }

  private connect(): void {
    if (this.stopping) return;
    const baseUrl = this.config.getOrThrow<string>('AI_WS_URL');
    const socket = new WebSocket(`${baseUrl}/cc?debug=1&ignore_hands_down=1`);
    this.socket = socket;
    socket.on('open', () => { this.attempts = 0; });
    socket.on('message', (data: RawData) => this.handleMessage(data));
    socket.on('error', (error) => this.logger.warn({ err: error }, 'AI WebSocket error'));
    socket.on('close', () => {
      if (this.socket !== socket) return;
      this.socket = undefined;
      this.sessions.clear();
      if (this.stopping) return;
      const delay = Math.min(1_000 * 2 ** this.attempts++, 30_000);
      this.timer = setTimeout(() => { this.timer = undefined; this.connect(); }, delay);
      this.timer.unref();
    });
  }

private handleMessage(data: RawData): void {
  let message: {
    type?: unknown;
    word?: unknown;
    callRoomIdx?: unknown;
  };

  const bytes = Array.isArray(data)
    ? Buffer.concat(data)
    : Buffer.isBuffer(data)
      ? data
      : Buffer.from(data);

  try {
    message = JSON.parse(bytes.toString('utf8'));
  } catch {
    return;
  }

  if (
    message.type !== 'word' ||
    typeof message.callRoomIdx !== 'number' ||
    !Number.isInteger(message.callRoomIdx) ||
    typeof message.word !== 'string' ||
    !message.word
  ) {
    return;
  }

  const session = this.sessions.get(message.callRoomIdx);
  if (!session) return;

  console.log(`Translate | ${{
    source: session.source,
    sessionId: session.sessionId,
    callRoomIdx: message.callRoomIdx,
    text: message.word,
  }}`);

  this.events.emit('translation', {
    source: session.source,
    sessionId: session.sessionId,
    callRoomIdx: message.callRoomIdx,
    text: message.word,
  });
}

  onModuleDestroy(): void {
    this.stopping = true;
    if (this.timer) clearTimeout(this.timer);
    this.socket?.terminate();
    this.sessions.clear();
    this.events.removeAllListeners();
  }
}
