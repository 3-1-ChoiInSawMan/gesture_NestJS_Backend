import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { HttpModule } from '@nestjs/axios';
import { MediasController } from './medias.controller';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    HttpModule,
    AuthModule,
  ],
  controllers: [MediasController],
  providers: [MediasService],
  exports: [MediasService],
})
export class MediasModule {}
