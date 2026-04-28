import { Module } from '@nestjs/common';
import { AuthControllerV1 } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthControllerV1],
  providers: [AuthService]
})
export class AuthModule {}
