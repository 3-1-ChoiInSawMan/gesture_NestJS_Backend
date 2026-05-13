import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { AxiosExceptionFilter } from './filters/axios-exception.filter';
import { GlobalResponseInterceptor } from './interceptors/global-response.interceptor';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const reflector = app.get(Reflector);

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);

  app.useGlobalFilters(new AxiosExceptionFilter());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new GlobalResponseInterceptor(reflector));
  app.useGlobalPipes(new ValidationPipe({
    transform: true
  }));

  app.enableCors({
    origin: process.env.SECURITY_CORS_ORIGIN?.split(',') ?? '*',
  });

  app.setGlobalPrefix('/api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })
  
  await app.listen(configService.get<number>('SERVER_PORT') ?? 3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
