import { Module } from '@nestjs/common';
import { CallRoomsService } from './call-rooms.service';
import { CallRoomsController } from './call-rooms.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [HttpModule, AuthModule, MediaModule],
  controllers: [CallRoomsController],
  providers: [CallRoomsService],
})
export class CallRoomsModule {}
