import { HttpService } from '@nestjs/axios';
import { Injectable, MessageEvent } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateNotificationDto } from './dto/request/create-notification.dto';
import { finalize, firstValueFrom, from, map, merge, Subject } from 'rxjs';
import { NotificationType } from './enum/notification-type.enum';
import { UpdateNotificationSettingDto } from './dto/request/update-notification-setting.dto';

@Injectable()
export class NotificationsService {
  private readonly SPRING_SERVER_URL: string;
  private readonly notificationStreams = new Map<number, Subject<MessageEvent>>();
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.SPRING_SERVER_URL = this.configService.getOrThrow<string>('SPRING_SERVER_URL');
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
    
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/notifications`, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );
    
    return {
      data: data.data
    };
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
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.SPRING_SERVER_URL}/notifications/${notificationIdx}/read`, undefined, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );
    
    return {
      data: data.data,
      message: data.message
    };
  }

  async getNotificationSetting(
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.get(`${this.SPRING_SERVER_URL}/notifications/settings`, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );
    
    return {
      data: data.data,
      message: data.message
    };
  }

  async updateNotificationSetting(
    notificationType: NotificationType,
    body: UpdateNotificationSettingDto,
    userIdx: number
  ) {
    const { data } = await firstValueFrom(
      this.httpService.patch(`${this.SPRING_SERVER_URL}/notifications/settings/${notificationType}`, body, {
        headers: {
          'X-User-Id': userIdx
        }
      })
    );
    
    return {
      data: data.data,
      message: data.message
    };
  }
}
