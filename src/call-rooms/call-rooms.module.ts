import { Module } from '@nestjs/common';
import { CallRoomsService } from './call-rooms.service';
import { CallRoomsController } from './call-rooms.controller';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';
import { MediasModule } from 'src/medias/medias.module';

@Module({
  imports: [
    HttpModule,
    AuthModule,
    MediasModule
  ],
  controllers: [CallRoomsController],
  providers: [CallRoomsService],
})
export class CallRoomsModule {}
