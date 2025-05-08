import { ApiProperty } from '@nestjs/swagger';
import { RecordStatus } from '@prisma/client';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateRecordDto {
  @ApiProperty({
    example: 'Một ngày vui vẻ',
    description: 'Title of the record',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    example: 'Có nhiều điều thú vị',
    description: 'Content of the record',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    example: 1,
    description: 'User id',
    required: true,
  })
  @IsPositive()
  user_id: number;

  @ApiProperty({
    example: '2025-05-01T13:38:00.000Z',
    description: 'Ngày của record',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({
    example: 5,
    description: 'Mood ID',
    required: true,
  })
  @IsNumber()
  @IsPositive()
  mood_id: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Activity ids',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { each: true })
  activity_id?: number[];

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status of the record',
    required: false,
  })
  @IsOptional()
  status?: RecordStatus;
}
