import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class RefreshTokenDto {
  @ValidateIf((body) => !body.refreshToken)
  @IsNotEmpty()
  @IsString()
  refresh_token?: string;

  @ValidateIf((body) => !body.refresh_token)
  @IsNotEmpty()
  @IsString()
  refreshToken?: string;
}
