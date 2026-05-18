import { IsBoolean, IsNotEmpty } from "class-validator";

export class UpdateNotificationSettingDto {
  @IsNotEmpty()
  @IsBoolean()
  enabled: boolean
}
