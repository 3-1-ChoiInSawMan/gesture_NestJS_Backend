import { Module } from '@nestjs/common';
import { CallRoomsService } from './call-rooms.service';
import { CallRoomsController } from './call-rooms.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [CallRoomsController],
  providers: [CallRoomsService],
})
export class CallRoomsModule {}
