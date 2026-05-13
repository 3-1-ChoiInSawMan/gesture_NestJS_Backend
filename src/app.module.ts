import { Module } from '@nestjs/common';
import { AppControllerV1 } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
<<<<<<< HEAD
import { FriendModule } from './friend/friend.module';
=======
import { CallRoomsModule } from './call-rooms/call-rooms.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MediasModule } from './medias/medias.module';
import { CallsModule } from './calls/calls.module';
>>>>>>> main

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'Capstone BFF',
        level: isProduction ? 'info' : 'debug',
        ...(isDevelopment
          ? {
            transport: {
              target: 'pino-pretty',
              options: {},
            },
          }
          : {}),
      },
    }),
    HttpModule,
    AuthModule,
    UsersModule,
<<<<<<< HEAD
    FriendModule,
=======
    CallRoomsModule,
    NotificationsModule,
    MediasModule,
    CallsModule,
>>>>>>> main
  ],
  controllers: [AppControllerV1],
  providers: [AppService],
})
export class AppModule { }
