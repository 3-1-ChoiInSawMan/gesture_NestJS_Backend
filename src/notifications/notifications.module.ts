import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';

@Module({
  imports: [HttpModule, CoreHttpModule, AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}
