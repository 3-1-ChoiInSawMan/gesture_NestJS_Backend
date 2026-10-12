import { Body, Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Sse, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from 'src/guards/jwt.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import { type JwtPayload } from 'src/common/jwt-payload.interface';
import { NotificationType } from './enum/notification-type.enum';
import { UpdateNotificationSettingDto } from './dto/client/request/update-notification-setting.dto';

@Controller({ path: '/notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService
  ) { };

  @UseGuards(JwtGuard)
  @Sse()
  async handleGetNotifications(
    @GetUser() user: JwtPayload
  ) {
    return this.notificationsService.subscribe(user.idx);
  }

  @UseGuards(JwtGuard)
  @Patch('/:notificationIdx/read')
  async handleReadNotification(
    @Param('notificationIdx', new ParseIntPipe()) notificationIdx: number,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.notificationsService.readNotification(notificationIdx, user.idx);

    return {
      data: {
        notification: data
      },
      message
    };
  }

  @UseGuards(JwtGuard)
  @Get('/settings')
  async handleGetNotificationSetting(
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.notificationsService.getNotificationSetting(user.idx);

    return {
      data: {
        notificationSettings: data
      },
      message
    };
  }

  @UseGuards(JwtGuard)
  @Patch('/settings/:notificationType')
  async handleUpdateNotificationSetting(
    @Param('notificationType', new ParseEnumPipe(NotificationType)) notificationType: NotificationType,
    @Body() body: UpdateNotificationSettingDto,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.notificationsService.updateNotificationSetting(notificationType, body, user.idx);

    return {
      data: {
        notificationSetting: data
      },
      message
    };
  }
}
