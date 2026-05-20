import { Body, Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Sse, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtGuard } from 'src/guards/jwt.guard';
import { GetUser } from 'src/decorators/get-user.decorator';
import { type JwtPayload } from 'src/common/jwt-payload.interface';
import { CreateNotificationDto } from './dto/client/request/create-notification.dto';
import { NotificationType } from './enum/notification-type.enum';
import { UpdateNotificationSettingDto } from './dto/client/request/update-notification-setting.dto';

@Controller({ path: '/notifications', version: '1' })
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService
  ) { };

  // 알림 생성
  /*
    내부에서만 사용하는 로직으로 변경해야 합니다.
    엔드포인트 삭제 예정이므로 리팩토링 대상에서 제외합니다.
  */
  @UseGuards(JwtGuard)
  @Post()
  async handleCreateNotification(
    @Body() body: CreateNotificationDto,
    @GetUser() user: JwtPayload
  ) {
    const { data, message } = await this.notificationsService.createNotification(body, user.idx);

    return {
      data: {
        notification: data
      },
      message
    };
  }

  // 알림 구독
  @UseGuards(JwtGuard)
  @Sse()
  async handleGetNotifications(
    @GetUser() user: JwtPayload
  ) {
    return this.notificationsService.subscribe(user.idx);
  }

  // 알림 읽음 처리
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

  // 알림 설정 조회
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

  // 알림 설정 변경
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
