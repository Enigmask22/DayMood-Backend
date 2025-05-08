import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateFileDto {
  @ApiProperty({
    example: 'image.jpg',
    description: 'Tên file',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  fname: string;

  @ApiProperty({
    example: 'image/jpeg',
    description: 'Loại file',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'URL của file',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    example: 'files/image.jpg',
    description: 'Khóa file trong storage',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  fkey: string;

  @ApiProperty({
    example: 1024,
    description: 'Kích thước file',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  size: number;

  @ApiProperty({
    example: '00:30',
    description: 'Thời lượng của file audio (chỉ áp dụng cho audio)',
    required: false,
  })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({
    example: 1,
    description: 'ID của bản ghi liên quan',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  record_id?: number;

  @ApiProperty({
    example: 1,
    description: 'ID của người dùng liên quan',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  user_id?: number;
}
