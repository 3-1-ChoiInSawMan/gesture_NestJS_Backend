import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller({ path: '/', version: '1' })
export class AppControllerV1 {
  constructor(private readonly appService: AppService) {}

  @Get()
  public getInfo() {
    return this.appService.getInfo();
  }
}
