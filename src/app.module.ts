import { Module } from '@nestjs/common';
import { AppControllerV1 } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { stdTimeFunctions } from 'pino';
import type { IncomingMessage } from 'node:http';
import { FriendModule } from './friend/friend.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MediasModule } from './medias/medias.module';
import { CallsModule } from './calls/calls.module';
import { CoreHttpModule } from './core-http/core-http.module';
import { QuickSlotModule } from './quick-slot/quick-slot.module';
import { MeetingsModule } from './meetings/meetings.module';
import { ChatRoomsModule } from './chat-rooms/chat-rooms.module';
import { ChatModule } from './chat/chat.module';

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

const requestUrl = (req: IncomingMessage) => (req as IncomingMessage & { originalUrl?: string }).originalUrl ?? req.url;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: isProduction ? 'info' : 'debug',
        redact: { paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'], censor: '[REDACTED]' },
        serializers: {
          req: (req: { id: unknown; method: string; url: string }) => ({ id: req.id, method: req.method, url: req.url }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        },
        customLogLevel: (_req, res, error) => (error || res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
        customSuccessMessage: (req, res, responseTime) => `${req.method} ${requestUrl(req)} ${res.statusCode} ${Math.round(responseTime)}ms`,
        customErrorMessage: (req, res, error) => `${req.method} ${requestUrl(req)} ${res.statusCode} ${error.message}`,
        ...(isDevelopment
          ? {
            transport: {
              target: 'pino-pretty',
              options: {},
            },
          }
          // Dozzle: JSON 한 줄, 문자열 level, ISO 시간, pid/hostname 제거
          : {
            base: null,
            timestamp: stdTimeFunctions.isoTime,
            formatters: { level: (label: string) => ({ level: label }) },
          }),
      },
    }),
    HttpModule,
    CoreHttpModule,
    AuthModule,
    UsersModule,
    FriendModule,
    NotificationsModule,
    MediasModule,
    CallsModule,
    ChatModule,
    QuickSlotModule,
    MeetingsModule,
    ChatRoomsModule,
  ],
  controllers: [AppControllerV1],
  providers: [AppService],
})
export class AppModule { }
