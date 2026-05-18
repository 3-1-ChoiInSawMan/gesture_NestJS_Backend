import { HttpService } from '@nestjs/axios';
import { Injectable, MessageEvent } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateNotificationDto } from './dto/client/request/create-notification.dto';
import { finalize, firstValueFrom, from, map, merge, Subject } from 'rxjs';
import { NotificationType } from './enum/notification-type.enum';
import { UpdateNotificationSettingDto } from './dto/client/request/update-notification-setting.dto';
import { CoreHttpService } from 'src/core-http/core-http.service';

import { CoreResponse } from 'src/common/core-response.interface';
import { Notification } from './dto/core/response/Notifications.interface';
import { NotificationRead } from './dto/core/response/NotificationRead.interface';
import { NotificationSettingStatus, NotificationSettingUpdate } from './dto/core/response/NotificationSettings.interface';

@Injectable()
export class NotificationsService {
  private readonly SPRING_SERVER_URL: string = "";
  private readonly notificationStreams = new Map<number, Subject<MessageEvent>>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly coreHttpService: CoreHttpService,
  ) {
    this.SPRING_SERVER_URL = configService.getOrThrow<string>("SPRING_SERVER_URL");
  };

  async createNotification(
    body: CreateNotificationDto,
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.SPRING_SERVER_URL}/notifications`, {
        ...body,
        actor_id: userIdx
      })
    );

    const notification = data.data;

    if (this.notificationStreams.has(notification.receiver_id)) {
      const { data: notifications } = await this.getNotifications(notification.receiver_id);

      this.emitToUser(notification.receiver_id, {
        notifications
      });
    }

    return {
      data: notification,
      message: data.message
    };
  }

  subscribe(
    userIdx: number
  ) {
    const subject = new Subject<MessageEvent>();

    this.notificationStreams.set(userIdx, subject);

    const initials = from(this.getNotifications(userIdx)).pipe(
      map(({ data }) => ({
        data: {
          notifications: data,
        },
      })),
    );

    return merge(initials, subject.asObservable()).pipe(
      finalize(() => {
        this.notificationStreams.delete(userIdx);
      }),
    );
  }

  async getNotifications(
    userIdx: number
  ) {

    const response = await this.coreHttpService.get<CoreResponse<Notification[]>>('/notifications', {
      headers: {
        'X-User-Id': userIdx
      }
    });

    return response;

  }

  emitToUser(
    userIdx: number,
    payload: object
  ) {
    const subject = this.notificationStreams.get(userIdx);

    if (!subject) return;

    subject.next({
      data: payload
    });
  }

  async readNotification(
    notificationIdx: number,
    userIdx: number
  ) {
    const response = await this.coreHttpService.patch<CoreResponse<NotificationRead>>(`/notifications/${notificationIdx}/read`, undefined, {
      headers: {
        'X-User-Id': userIdx
      }
    })

    return response;
  }

  async getNotificationSetting(
    userIdx: number
  ) {
    const response = await this.coreHttpService.get<CoreResponse<NotificationSettingStatus[]>>('/notifications/settings', {
      headers: {
        'X-User-Id': userIdx
      }
    });

    return response;
  }

  async updateNotificationSetting(
    notificationType: NotificationType,
    body: UpdateNotificationSettingDto,
    userIdx: number
  ) {
    const response = await this.coreHttpService.patch<CoreResponse<NotificationSettingUpdate>>(`/notifications/settings/${notificationType}`, body, {
      headers: {
        'X-User-Id': userIdx
      }
    });

    return response;
  }
}
