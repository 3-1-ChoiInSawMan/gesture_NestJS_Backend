import { Controller, Get, Param, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { MediasService } from './medias.service';
import { JwtGuard } from 'src/guards/jwt.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetUser } from 'src/decorators/get-user.decorator';
import type { JwtPayload } from 'src/common/jwt-payload.interface';

@Controller({ path: '/medias', version: '1' })
export class MediasController {
  constructor(
    private readonly mediasService: MediasService,
  ) { };

  @UseGuards(JwtGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async uploadMedia(
    @UploadedFile() file: Express.Multer.File | undefined,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.mediasService.uploadMedia(file, user.idx);

    return {
      data: {
        file: data
      },
      message,
    };
  }
  @UseGuards(JwtGuard)
  @Get('/:mediaUUID')
  async getMediaByUUID(
    @Param('mediaUUID') mediaUUID: string,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.mediasService.getMediaByUUID(mediaUUID, user.idx);

    return {
      data: {
        file: data
      },
      message,
    };
  }
}
