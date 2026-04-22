import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from 'src/guards/jwt.guard';

@Module({
  imports: [HttpModule, JwtModule.register({})],
  controllers: [UsersController],
  providers: [UsersService, JwtGuard]
})
export class UsersModule {}
