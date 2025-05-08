import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateActivityRecordDto {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Danh sách ID của activities',
    type: [Number],
    required: true,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  activity_id: number[];

  @ApiProperty({
    example: 1,
    description: 'ID của record',
    required: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  record_id: number;
}
