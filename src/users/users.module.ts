import { Module } from '@nestjs/common';
import { UsersControllerV1 } from './users.controller';
import { UsersService } from './users.service';
import { AuthModule } from 'src/auth/auth.module';
import { MediasModule } from 'src/medias/medias.module';
import { CoreHttpModule } from 'src/core-http/core-http.module';

@Module({
  imports: [
    CoreHttpModule,
    AuthModule,
    MediasModule
  ],
  controllers: [UsersControllerV1],
  providers: [UsersService],
})
export class UsersModule {}
