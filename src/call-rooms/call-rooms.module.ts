import { Module } from '@nestjs/common';
import { CallRoomsService } from './call-rooms.service';
import { CallRoomsController } from './call-rooms.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MediasModule } from 'src/medias/medias.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';

@Module({
  imports: [
    CoreHttpModule,
    AuthModule,
    MediasModule
  ],
  controllers: [CallRoomsController],
  providers: [CallRoomsService],
})
export class CallRoomsModule {}
