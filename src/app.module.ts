import { Module } from '@nestjs/common';
import { AppControllerV1 } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppControllerV1],
  providers: [AppService],
})
export class AppModule { }
