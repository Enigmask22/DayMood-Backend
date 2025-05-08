import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { ResponseMessage } from 'src/decorator/customize';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from 'src/decorator/customize';
@ApiTags('files')
@ApiBearerAuth('token')
@Controller({ path: 'files', version: '1' })
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Tạo thông tin file mới',
    description:
      'Lưu thông tin file vào database sau khi đã upload lên storage',
  })
  @ApiBody({
    type: CreateFileDto,
    description: 'Thông tin file để tạo',
  })
  @ApiResponse({
    status: 201,
    description: 'Tạo thông tin file thành công',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Tạo thông tin file thành công' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            fname: { type: 'string', example: 'image.jpg' },
            type: { type: 'string', example: 'image/jpeg' },
            url: { type: 'string', example: 'https://example.com/image.jpg' },
            fkey: { type: 'string', example: 'files/image.jpg' },
            size: { type: 'number', example: 1024 },
            record_id: { type: 'number', example: 1 },
            user_id: { type: 'number', example: null },
            created_time: {
              type: 'string',
              example: '2023-01-01T00:00:00.000Z',
            },
            updated_time: {
              type: 'string',
              example: '2023-01-01T00:00:00.000Z',
            },
          },
        },
      },
    },
  })
  @ResponseMessage('Tạo thông tin file thành công')
  create(@Body() createFileDto: CreateFileDto) {
    return this.filesService.create(createFileDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy tất cả file',
    description: 'Lấy danh sách tất cả các file',
  })
  @ResponseMessage('Lấy danh sách file thành công')
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy file theo ID',
    description: 'Lấy thông tin chi tiết của file theo ID',
  })
  @ResponseMessage('Lấy thông tin file thành công')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.filesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật thông tin file',
    description: 'Cập nhật thông tin chi tiết của file theo ID',
  })
  @ResponseMessage('Cập nhật thông tin file thành công')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFileDto: UpdateFileDto,
  ) {
    return this.filesService.update(id, updateFileDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({
    summary: 'Xóa file',
    description: 'Xóa thông tin file theo ID',
  })
  @ResponseMessage('Xóa file thành công')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.filesService.remove(id);
  }
}
