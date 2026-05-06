import { Module } from '@nestjs/common';
import { CallRoomsService } from './call-rooms.service';
import { CallRoomsController } from './call-rooms.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [CallRoomsController],
  providers: [CallRoomsService],
})
export class CallRoomsModule {}
