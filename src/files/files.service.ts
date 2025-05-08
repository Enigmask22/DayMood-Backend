import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FilesService {
  constructor(private prismaService: PrismaService) {}

  async create(createFileDto: CreateFileDto) {
    try {
      const newFile = await this.prismaService.file.create({
        data: {
          fname: createFileDto.fname,
          type: createFileDto.type,
          url: createFileDto.url,
          fkey: createFileDto.fkey,
          size: createFileDto.size,
          duration: createFileDto.duration,
          record_id: createFileDto.record_id,
          user_id: createFileDto.user_id,
        },
      });
      return newFile;
    } catch (error) {
      throw new BadRequestException('Lỗi khi tạo file: ' + error.message);
    }
  }

  async findAll() {
    try {
      return await this.prismaService.file.findMany();
    } catch (error) {
      throw new BadRequestException(
        'Lỗi khi lấy danh sách file: ' + error.message,
      );
    }
  }

  async findOne(id: number) {
    try {
      const file = await this.prismaService.file.findUnique({
        where: { id: Number(id) },
      });

      if (!file) {
        throw new NotFoundException('Không tìm thấy file với ID: ' + id);
      }

      return file;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Lỗi khi lấy thông tin file: ' + error.message,
      );
    }
  }

  async update(id: number, updateFileDto: UpdateFileDto) {
    try {
      const existingFile = await this.prismaService.file.findUnique({
        where: { id: Number(id) },
      });

      if (!existingFile) {
        throw new NotFoundException('Không tìm thấy file với ID: ' + id);
      }

      return await this.prismaService.file.update({
        where: { id: Number(id) },
        data: updateFileDto,
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Lỗi khi cập nhật file: ' + error.message);
    }
  }

  async remove(id: number) {
    try {
      const existingFile = await this.prismaService.file.findUnique({
        where: { id: Number(id) },
      });

      if (!existingFile) {
        throw new NotFoundException('Không tìm thấy file với ID: ' + id);
      }

      return await this.prismaService.file.delete({
        where: { id: Number(id) },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Lỗi khi xóa file: ' + error.message);
    }
  }
}
