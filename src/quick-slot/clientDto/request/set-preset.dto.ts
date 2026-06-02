import { IsArray, IsInt, Min } from 'class-validator';

export class SetPresetDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  quickSlotIds: number[];
}
