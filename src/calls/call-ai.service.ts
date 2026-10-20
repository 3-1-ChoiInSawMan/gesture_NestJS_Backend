import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket, { type RawData } from 'ws';
import { EventEmitter } from 'node:events';

type Source = 'frame' | 'audio';
interface Pending { source: Source; sessionId: string }
interface RoomStats { frame: number; audio: number; bytes: number; rejected: number; words: number }
export interface Translation { source: Source; callRoomIdx: number; sessionId: string; text: string }

const STATS_INTERVAL_MS = 10_000;

@Injectable()
export class CallAiService implements OnModuleInit, OnModuleDestroy {
  private socket?: WebSocket;
  private timer?: NodeJS.Timeout;
  private statsTimer?: NodeJS.Timeout;
  private attempts = 0;
  private stopping = false;
  private ignored = 0;
  private readonly sessions = new Map<number, Pending>();
  private readonly stats = new Map<number, RoomStats>();
  private readonly events = new EventEmitter();
  private readonly logger = new Logger(CallAiService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.connect();
    this.statsTimer = setInterval(() => this.flushStats(), STATS_INTERVAL_MS);
    this.statsTimer.unref();
  }

  onTranslation(listener: (translation: Translation) => void): () => void {
    this.events.on('translation', listener);
    return () => { this.events.off('translation', listener); };
  }

  send(source: Source, callRoomIdx: number, content: unknown, sessionId: string): { accepted: boolean } {
    const stats = this.roomStats(callRoomIdx);
    if (this.socket?.readyState !== WebSocket.OPEN) {
      stats.rejected++;
      return { accepted: false };
    }

    this.sessions.set(callRoomIdx, { source, sessionId });
    const payload = JSON.stringify({ [source]: content, callRoomIdx });
    stats[source]++;
    stats.bytes += payload.length;

    this.socket.send(payload, (error) => {
      if (!error) return;
      this.logger.error({ err: error, callRoomIdx, source }, 'AI WebSocket send failed');
      this.socket?.terminate();
    });

    return { accepted: true };
  }

  private connect(): void {
    if (this.stopping) return;
    const url = `${this.config.getOrThrow<string>('AI_WS_URL')}/cc?debug=1&ignore_hands_down=1`;
    const socket = new WebSocket(url);
    let lastError: Error | undefined;
    this.socket = socket;
    socket.on('open', () => {
      this.logger.log({ url, attempts: this.attempts }, 'AI WebSocket connected');
      this.attempts = 0;
    });
    socket.on('message', (data: RawData) => this.handleMessage(data));
    // 'error' 뒤에는 항상 'close'가 오므로 close 로그 한 줄에 합칩니다.
    socket.on('error', (error) => { lastError = error; });
    socket.on('close', (code, reason) => {
      if (this.socket !== socket) return;
      this.socket = undefined;
      const droppedRooms = [...this.sessions.keys()];
      this.sessions.clear();
      if (this.stopping) return;
      const delay = Math.min(1_000 * 2 ** this.attempts++, 30_000);
      this.logger.warn(
        { url, code, reason: reason?.toString(), error: lastError?.message, droppedRooms, retryInMs: delay, attempt: this.attempts },
        'AI WebSocket closed; reconnecting',
      );
      this.timer = setTimeout(() => { this.timer = undefined; this.connect(); }, delay);
      this.timer.unref();
    });
  }

  private handleMessage(data: RawData): void {
    const bytes = Array.isArray(data) ? Buffer.concat(data) : Buffer.isBuffer(data) ? data : Buffer.from(data);
    let message: { type?: unknown; word?: unknown; callRoomIdx?: unknown };
    try {
      message = JSON.parse(bytes.toString('utf8')) as typeof message;
    } catch {
      this.logger.warn({ bytes: bytes.length, preview: bytes.subarray(0, 200).toString('utf8') }, 'AI WebSocket sent invalid JSON');
      return;
    }

    if (message.type !== 'word') {
      this.ignored++;
      return;
    }
    const { word, callRoomIdx } = message;
    if (typeof callRoomIdx !== 'number' || !Number.isInteger(callRoomIdx) || typeof word !== 'string' || !word) {
      this.logger.warn({ message }, 'AI WebSocket sent malformed word');
      return;
    }

    const session = this.sessions.get(callRoomIdx);
    if (!session) {
      this.logger.debug({ callRoomIdx, word }, 'AI word dropped: no active session for room');
      return;
    }

    this.roomStats(callRoomIdx).words++;
    const translation: Translation = { source: session.source, sessionId: session.sessionId, callRoomIdx, text: word };
    this.logger.log(translation, 'AI translation received');
    this.events.emit('translation', translation);
  }

  private roomStats(callRoomIdx: number): RoomStats {
    let stats = this.stats.get(callRoomIdx);
    if (!stats) {
      stats = { frame: 0, audio: 0, bytes: 0, rejected: 0, words: 0 };
      this.stats.set(callRoomIdx, stats);
    }
    return stats;
  }

  private flushStats(): void {
    if (this.stats.size === 0 && this.ignored === 0) return;
    this.logger.log({
      intervalMs: STATS_INTERVAL_MS,
      connected: this.socket?.readyState === WebSocket.OPEN,
      ignored: this.ignored,
      rooms: Object.fromEntries(this.stats),
    }, 'AI relay stats');
    this.stats.clear();
    this.ignored = 0;
  }

  onModuleDestroy(): void {
    this.stopping = true;
    if (this.timer) clearTimeout(this.timer);
    if (this.statsTimer) clearInterval(this.statsTimer);
    this.socket?.terminate();
    this.sessions.clear();
    this.stats.clear();
    this.events.removeAllListeners();
  }
}
