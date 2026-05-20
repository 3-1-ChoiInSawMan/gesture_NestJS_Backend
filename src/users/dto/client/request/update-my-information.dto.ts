import { IsNotEmpty, IsOptional } from "class-validator";

export class UpdateMyInformationDto {
  @IsOptional()
  @IsNotEmpty()
  nickname: string;

  @IsOptional()
  @IsNotEmpty()
  statusMessage: string;
}
