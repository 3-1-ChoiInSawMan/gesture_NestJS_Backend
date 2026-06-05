import { Type } from 'class-transformer';
import { IsArray, IsInt, Min, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

export type FramePoint = [number, number];

@ValidatorConstraint({ name: 'isFramePointArray', async: false })
class IsFramePointArrayConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return Array.isArray(value)
      && value.length > 0
      && value.every((point) => (
        Array.isArray(point)
        && point.length === 2
        && point.every((coordinate) => typeof coordinate === 'number' && Number.isFinite(coordinate))
      ));
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a non-empty array of [number, number] points`;
  }
}

export class SendFrameDto {
  @IsArray()
  @Validate(IsFramePointArrayConstraint)
  frame: FramePoint[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  callRoomIdx: number;
}
