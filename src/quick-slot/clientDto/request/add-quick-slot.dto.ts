import { IsNotEmpty, IsString } from 'class-validator';

export class AddQuickSlotDto {
  @IsNotEmpty()
  @IsString()
  iconUuid: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
