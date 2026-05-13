import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from 'src/guards/jwt.guard';
import { AuthControllerV1 } from './auth.controller';
import { AuthService } from './auth.service';
import { WsGuard } from 'src/guards/ws.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthControllerV1],
  providers: [AuthService, JwtGuard, WsGuard],
  exports: [JwtModule, JwtGuard, WsGuard],
})
export class AuthModule {}
