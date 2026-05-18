import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CoreHttpService } from './core-http.service';

@Module({
  imports: [HttpModule],
  providers: [CoreHttpService],
  exports: [CoreHttpService],
})
export class CoreHttpModule {}
