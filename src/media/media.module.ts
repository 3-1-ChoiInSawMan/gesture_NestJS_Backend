import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  providers: [MediaService],
  exports: [MediaService]
})
export class MediaModule {}
