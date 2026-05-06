import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateNotificationDto } from './dto/request/create-notification.dto';
import { firstValueFrom } from 'rxjs';
import { NotificationType } from './enum/notification-type.enum';
import { UpdateNotificationSettingDto } from './dto/request/update-notification-setting.dto';

@Injectable()
export class NotificationsService {
  private readonly SPRING_SERVER_URL: string;
  
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
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

    return {
      data: data.data,
      message: data.message
    };
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
      data: data.data,
      message: data.message
    };
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
