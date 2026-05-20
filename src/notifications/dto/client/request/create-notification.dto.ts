import { IsEnum, IsNotEmpty } from "class-validator";
import { NotificationType } from "src/notifications/enum/notification-type.enum";

export class CreateNotificationDto {
  @IsNotEmpty()
  receiverId: number;
  
  @IsNotEmpty()
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsNotEmpty()
  targetId: number;
}
