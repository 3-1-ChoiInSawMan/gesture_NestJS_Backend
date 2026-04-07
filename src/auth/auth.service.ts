import { Injectable } from '@nestjs/common';
<<<<<<< HEAD
import { MailService } from 'src/mail/mail.service';
=======
>>>>>>> 009d5dd (Refactor: 메일 관련 로직 삭제)

@Injectable()
export class AuthService {
  constructor (
<<<<<<< HEAD
    private readonly mailService: MailService,
=======
>>>>>>> 009d5dd (Refactor: 메일 관련 로직 삭제)
  ) { };

  public async registerEmail() {
    
  }
}
