import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipResponseInterceptor } from './decorators/skip-response-interceptor.decorator';

@Controller({ path: '/', version: '1' })
export class AppControllerV1 {
  constructor(private readonly appService: AppService) {}

  @Get()
  @SkipResponseInterceptor()
  public getInfo() {
    return this.appService.getInfo();
  }
}
