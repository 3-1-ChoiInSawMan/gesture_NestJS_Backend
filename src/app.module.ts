import { Module } from '@nestjs/common';
import { AppControllerV1 } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { CallRoomsModule } from './call-rooms/call-rooms.module';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        name: 'Capstone BFF',
        level: isProduction ? 'info' : 'debug',
        transport: {
          targets: [
            {
              target: 'pino/file',
              options: { destination: './log.json', mkdir: true },
              level: isProduction ? 'info' : 'debug',
            },
            ...(isProduction
              ? []
              : [{ target: 'pino-pretty', options: {}, level: 'debug' }]),
          ],
        },
      },
    }),
    HttpModule,
    AuthModule,
    UsersModule,
    CallRoomsModule,
  ],
  controllers: [AppControllerV1],
  providers: [AppService],
})
export class AppModule { }
