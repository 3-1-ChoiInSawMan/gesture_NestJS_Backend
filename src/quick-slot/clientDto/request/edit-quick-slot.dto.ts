import { IsNotEmpty, IsString } from 'class-validator';

export class EditQuickSlotDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  iconUuid: string;
}
