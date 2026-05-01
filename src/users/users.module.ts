import { Module } from '@nestjs/common';
import { UsersControllerV1 } from './users.controller';
import { UsersService } from './users.service';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [UsersControllerV1],
  providers: [UsersService],
})
export class UsersModule {}
