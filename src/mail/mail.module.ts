import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        transport: {
          host: config.getOrThrow<string>('MAIL_SMTP_HOST'),
          port: parseInt(config.getOrThrow<string>('MAIL_SMTP_PORT')),
          auth: {
            user: config.getOrThrow<string>('MAIL_USER'),
            pass: config.getOrThrow<string>('MAIL_PASS'),
          }
        },
        defaults: {
          from: `"제스처" <${config.getOrThrow<string>('MAIL_USER')}>`
        }
      })
    })
  ],
  providers: [MailService],
  exports: [MailService]
})
export class MailModule { };