import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
<<<<<<< HEAD
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [MailModule],
=======

@Module({
>>>>>>> 009d5dd (Refactor: 메일 관련 로직 삭제)
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule {}
