import { IsEnum, IsNotEmpty } from "class-validator";
import { NotificationType } from "src/notifications/enum/notification-type.enum";

export class CreateNotificationDto {
  @IsNotEmpty()
  receiver_id: number;
  
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  target_id: number;
}
