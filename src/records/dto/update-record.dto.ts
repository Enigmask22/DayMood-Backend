import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRecordDto } from './create-record.dto';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { CreateFileDto } from 'src/files/dto/create-file.dto';

export class UpdateRecordDto extends PartialType(CreateRecordDto) {
  @ApiProperty({
    example: [1, 2, 3],
    description: 'Danh sách activity_id mới (sẽ ghi đè lên danh sách cũ)',
    required: false,
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  activity_ids?: number[];

  @ApiProperty({
    example: [
      {
        fname: 'image.jpg',
        type: 'image/jpeg',
        url: 'https://example.com/image.jpg',
        fkey: 'files/image.jpg',
        size: 1024,
      },
    ],
    description: 'Danh sách file mới cần thêm vào record',
    required: false,
    type: [CreateFileDto],
  })
  @IsOptional()
  @IsArray()
  new_files?: CreateFileDto[];
}
