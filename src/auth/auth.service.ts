import { Injectable } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class AuthService {
  constructor (
    private readonly mailService: MailService,
  ) { };

  public async registerEmail() {
    
  }
}
