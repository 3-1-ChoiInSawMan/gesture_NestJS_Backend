import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

// 왼손 21 + 오른손 21 + 어깨 2 랜드마크의 (x, y)를 펼친 길이
export const FRAME_VECTOR_LENGTH = 88;

export type FrameVector = number[];

@ValidatorConstraint({ name: 'isFrameVectorArray', async: false })
class IsFrameVectorArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return Array.isArray(value)
      && value.length > 0
      && value.every((vector) => (
        Array.isArray(vector)
        && vector.length === FRAME_VECTOR_LENGTH
        && vector.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))
      ));
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a non-empty array of ${FRAME_VECTOR_LENGTH}-number frame vectors`;
  }
}

export class SendFrameDto {
  @IsArray()
  @Validate(IsFrameVectorArrayConstraint)
  frame: FrameVector[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  callRoomIdx: number;
}
