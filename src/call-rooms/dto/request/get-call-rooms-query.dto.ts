import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { CallRoomCategory } from "src/call-rooms/enums/call-room-category.enum";
import { CallRoomSort } from "src/call-rooms/enums/call-room-sort.enum";

export class GetCallRoomsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  size?: number;

  @IsOptional()
  @IsEnum(CallRoomSort)
  sort?: CallRoomSort;

  @IsOptional()
  @IsEnum(CallRoomCategory)
  category?: CallRoomCategory;
}
