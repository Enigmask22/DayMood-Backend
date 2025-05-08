import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { InjectModel } from '@nestjs/mongoose';
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
import { RegisterDto } from 'src/auth/dto/create-user.dto';
import { IUser } from '../interface/users.interface';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PaginateInfo } from 'src/interface/paginate.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateActivityRecordDto } from './dto/create-activity-record.dto';

@Injectable()
export class RecordsService {
  constructor(private prismaService: PrismaService) {}

  getHashedPassword = (password: string) => {
    const salt = genSaltSync(10);
    const hashedPassword = hashSync(password, salt);
    return hashedPassword;
  };

  async create(createRecordDto: CreateRecordDto) {
    try {
      // Tạo record với các trường tùy chọn
      // Nếu chỉ có mood_id và datetime được cung cấp, sử dụng giá trị mặc định cho các trường khác
      const newRecord = await this.prismaService.record.create({
        data: {
          title: createRecordDto.title || '',
          content: createRecordDto.content || '',
          status: createRecordDto.status || 'ACTIVE',
          mood_id: createRecordDto.mood_id,
          user_id: createRecordDto.user_id,
          date: createRecordDto.date
            ? new Date(createRecordDto.date)
            : new Date(),
        },
      });

      // Nếu có các activity_id, thêm vào bảng ActivityRecord
      if (
        createRecordDto.activity_id &&
        createRecordDto.activity_id.length > 0
      ) {
        await this.prismaService.activityRecord.createMany({
          data: createRecordDto.activity_id.map((activityId) => ({
            activity_id: activityId,
            record_id: newRecord.id,
          })),
        });
      }

      return newRecord;
    } catch (error) {
      throw new BadRequestException('Lỗi khi tạo record: ' + error.message);
    }
  }

  async findAll(info: PaginateInfo) {
    const { skip, take, page, where } = info;

    try {
      const userId = where?.user_id; // Lấy user_id từ where nếu có

      const result = await this.prismaService.record.findMany({
        where: {
          ...where,
          user_id: userId ? parseInt(userId.toString()) : undefined, // Đảm bảo lọc theo user_id
        },
        orderBy: {
          date: 'desc', // Sắp xếp theo date giảm dần
        },
      });

      const totalItems = result.length;
      const totalPages = Math.ceil(+totalItems / take);

      return {
        meta: {
          totalRecords: +totalItems,
          recordsPerPage: take,
          totalPages,
          currentPage: page,
        },
        items: result,
      };
    } catch (error) {
      throw new BadRequestException('Lỗi khi tìm records: ' + error.message);
    }
  }

  async findOne(id: number, userId?: number) {
    try {
      const record = await this.prismaService.record.findFirst({
        where: {
          id,
          ...(userId ? { user_id: userId } : {}), // Lọc theo user_id nếu được cung cấp
        },
        include: {
          activities: true,
          files: true,
        },
      });

      if (!record) {
        throw new NotFoundException(`Không tìm thấy record với ID: ${id}`);
      }

      return record;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Lỗi khi tìm record: ' + error.message);
    }
  }

  async update(id: number, updateRecordDto: UpdateRecordDto) {
    try {
      // Kiểm tra record tồn tại
      const existingRecord = await this.prismaService.record.findUnique({
        where: { id },
        include: { activities: true },
      });

      if (!existingRecord) {
        throw new NotFoundException(`Không tìm thấy record với ID: ${id}`);
      }

      // Cập nhật thông tin record cơ bản
      const { activity_ids, new_files, ...basicRecordData } = updateRecordDto;

      const updatedRecord = await this.prismaService.record.update({
        where: { id },
        data: {
          ...basicRecordData,
          // Chuyển đổi date từ string sang Date nếu có
          ...(updateRecordDto.date
            ? { date: new Date(updateRecordDto.date) }
            : {}),
        },
      });

      // Xử lý cập nhật activities nếu có
      if (activity_ids && activity_ids.length > 0) {
        // Xóa tất cả activity cũ
        await this.prismaService.activityRecord.deleteMany({
          where: { record_id: id },
        });

        // Thêm các activity mới
        await this.prismaService.activityRecord.createMany({
          data: activity_ids.map((activityId) => ({
            activity_id: activityId,
            record_id: id,
          })),
          skipDuplicates: true,
        });
      }

      // Xử lý thêm files mới nếu có
      if (new_files && new_files.length > 0) {
        for (const fileData of new_files) {
          await this.prismaService.file.create({
            data: {
              fname: fileData.fname,
              type: fileData.type,
              url: fileData.url,
              fkey: fileData.fkey,
              size: fileData.size,
              duration: fileData.duration,
              record_id: id,
              user_id: existingRecord.user_id,
            },
          });
        }
      }

      // Trả về record đã cập nhật kèm theo activities và files
      const updatedRecordWithRelations =
        await this.prismaService.record.findUnique({
          where: { id },
          include: {
            activities: true,
            files: true,
          },
        });

      return updatedRecordWithRelations;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Lỗi khi cập nhật record: ' + error.message,
      );
    }
  }

  async remove(id: number) {
    const result = await this.prismaService.$queryRaw<any>`
      DELETE FROM records
      WHERE "id" = ${id}
      RETURNING *;
      `;
    if (result.length === 0) {
      throw new HttpException('Record not found', HttpStatus.NOT_FOUND);
    }
    return result;
  }

  async addActivities(
    recordId: number,
    createActivityRecordDto: CreateActivityRecordDto,
  ) {
    try {
      // Kiểm tra xem record có tồn tại không
      const existingRecord = await this.prismaService.record.findUnique({
        where: { id: recordId },
      });

      if (!existingRecord) {
        throw new NotFoundException(
          `Không tìm thấy record với ID: ${recordId}`,
        );
      }

      // Tạo các bản ghi activity_record
      const createdActivities =
        await this.prismaService.activityRecord.createMany({
          data: createActivityRecordDto.activity_id.map((activityId) => ({
            activity_id: activityId,
            record_id: recordId,
          })),
          skipDuplicates: true, // Bỏ qua các cặp (activity_id, record_id) đã tồn tại
        });

      // Lấy danh sách các activity record đã tạo
      const activityRecords = await this.prismaService.activityRecord.findMany({
        where: {
          record_id: recordId,
          activity_id: {
            in: createActivityRecordDto.activity_id,
          },
        },
      });

      return activityRecords;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Lỗi khi thêm activities: ' + error.message,
      );
    }
  }
}
