import { Module } from '@nestjs/common';
import { MediasService } from './medias.service';
import { MediasController } from './medias.controller';
import { AuthModule } from 'src/auth/auth.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';

@Module({
  imports: [
    CoreHttpModule,
    AuthModule,
  ],
  controllers: [MediasController],
  providers: [MediasService],
  exports: [MediasService],
})
export class MediasModule {}
