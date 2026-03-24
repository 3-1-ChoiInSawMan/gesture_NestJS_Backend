import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { };

  public sendVerificationMail(email: string, verificationCode: string) {
    this.mailerService.sendMail({
      to: email,
      from: this.configService.get<string>('MAIL_USER'),
      subject:
        '[제스처] 회원가입 인증코드입니다.',
      text: `인증코드: ${verificationCode}`
    }).then((result) => {
      console.log(result);
    }).catch((error) => {
      console.log(error);
    });
  }
}