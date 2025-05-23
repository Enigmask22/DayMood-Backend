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

  private calculateMoodStats(records: any[]) {
    const moodStats: Record<number, number> = {};
    records.forEach(record => {
      if (record.mood_id) {
        moodStats[record.mood_id] = (moodStats[record.mood_id] || 0) + 1;
      }
    });

    // Chuyển đổi object thành mảng và sắp xếp theo số lần xuất hiện giảm dần
    return Object.entries(moodStats).map(([moodId, count]) => ({
      moodId: parseInt(moodId),
      count,
      percentage: (count / records.length) * 100 // Tính phần trăm xuất hiện
    })).sort((a, b) => b.count - a.count);
  }

  private getAllDaysInMonth(year: number, month: number): string[] {
    const days: string[] = [];
    const lastDay = new Date(year, month + 1, 0).getDate(); // Lấy ngày cuối cùng của tháng
    
    for (let day = 2; day <= lastDay + 1; day++) {
      const date = new Date(year, month, day);
      days.push(date.toISOString().split('T')[0]);
    }
    
    return days;
  }

  private calculateDailyMoodStats(records: any[], year: number, month: number) {
    const dailyStats: Record<string, Record<number, number>> = {};
    
    // Lấy tất cả các ngày trong tháng
    const allDaysInMonth = this.getAllDaysInMonth(year, month);
    
    // Khởi tạo tất cả các ngày với moodStats rỗng
    allDaysInMonth.forEach(date => {
      dailyStats[date] = {};
    });
    
    // Đếm số lượng mood cho mỗi ngày có record
    records.forEach(record => {
      if (record.mood_id) {
        const date = record.date.toISOString().split('T')[0];
        dailyStats[date][record.mood_id] = (dailyStats[date][record.mood_id] || 0) + 1;
      }
    });

    // Chuyển đổi thành mảng và sắp xếp theo ngày tăng dần
    return Object.entries(dailyStats).map(([date, moodCounts]) => ({
      date,
      moodStats: Object.entries(moodCounts).map(([moodId, count]) => ({
        moodId: parseInt(moodId),
        count
      })).sort((a, b) => b.count - a.count),
      totalRecords: Object.values(moodCounts).reduce((sum, count) => sum + count, 0)
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private findMostFrequentMood(moodStats: any[]) {
    if (moodStats.length === 0) {
      return {
        moodId: null,
        count: 0
      };
    }
    return {
      moodId: moodStats[0].moodId,
      count: moodStats[0].count
    };
  }

  async statisticMood(info: PaginateInfo) {
    const { where } = info;
    try {
      const userId = where?.user_id;
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      // Chuyển đổi user_id thành number
      const parsedUserId = Number(userId);
      if (isNaN(parsedUserId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Lấy thời gian hiện tại
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Bắt đầu từ Chủ nhật
      startOfWeek.setHours(0, 0, 0, 0);

      // Xử lý tháng và năm từ where condition
      let startOfMonth: Date;
      let month: number;
      let year: number;
      
      if (where?.date?.month || where?.date?.year) {
        month = where.date.month ? Number(where.date.month) - 1 : now.getMonth(); // Tháng trong JS là 0-11
        year = where.date.year ? Number(where.date.year) : now.getFullYear();
        startOfMonth = new Date(year, month, 1);
      } else {
        month = now.getMonth();
        year = now.getFullYear();
        startOfMonth = new Date(year, month, 1);
      }

      // Lấy tất cả records của user trong tuần và tháng
      const records = await this.prismaService.record.findMany({
        where: {
          user_id: parsedUserId,
          date: {
            gte: startOfMonth,
            lt: new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 1), // Ngày đầu tiên của tháng tiếp theo
          },
        },
        select: {
          mood_id: true,
          date: true,
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Phân loại records theo tuần và tháng
      const weeklyRecords = records.filter(record => record.date >= startOfWeek);
      const monthlyRecords = records;

      // Thống kê mood theo tuần và tháng
      const weeklyMoodStats = this.calculateMoodStats(weeklyRecords);
      const monthlyMoodStats = this.calculateMoodStats(monthlyRecords);
      const dailyMoodStats = this.calculateDailyMoodStats(monthlyRecords, year, month);

      // Tìm mood xuất hiện nhiều nhất
      const weeklyMostFrequentMood = this.findMostFrequentMood(weeklyMoodStats);
      const monthlyMostFrequentMood = this.findMostFrequentMood(monthlyMoodStats);

      return {
        weekly: {
          moodStats: weeklyMoodStats,
          mostFrequentMood: weeklyMostFrequentMood,
          totalRecords: weeklyRecords.length,
        },
        monthly: {
          moodStats: monthlyMoodStats,
          dailyMoodStats: dailyMoodStats,
          mostFrequentMood: monthlyMostFrequentMood,
          totalRecords: monthlyRecords.length,
          month: month + 1, // Chuyển về tháng 1-12
          year: year,
        },
      };
    } catch (error) {
      throw new BadRequestException('Lỗi khi thống kê: ' + error.message);
    }
  }

private calculateActivityStats(records: any[], year: number, month: number) {
  // Create a map to store activity counts by day
  const activityStatsByDay: Record<string, Record<number, number>> = {};
  
  // Get all days in the month
  const allDaysInMonth = this.getAllDaysInMonth(year, month);
  
  // Initialize all days with empty activity counts
  allDaysInMonth.forEach(date => {
    activityStatsByDay[date] = {};
  });
  
  // Count activities for each day
  records.forEach(record => {
    if (record.activities && record.activities.length > 0) {
      const dateStr = record.date.toISOString().split('T')[0];
      
      // Count each activity type - handle the activity_records properly
      record.activities.forEach(activityRecord => {
        const activityId = activityRecord.activity_id;
        activityStatsByDay[dateStr][activityId] = (activityStatsByDay[dateStr][activityId] || 0) + 1;
      });
    }
  });
  
  // Convert to desired output format - activity_id: [count for day1, count for day2, ...]
  const result: Record<number, number[]> = {};
  
  // Find all unique activity IDs
  const allActivityIds = new Set<number>();
  Object.values(activityStatsByDay).forEach(dayStats => {
    Object.keys(dayStats).forEach(activityId => {
      allActivityIds.add(Number(activityId));
    });
  });
  
  // For each activity ID, create an array of counts for each day
  allActivityIds.forEach(activityId => {
    result[activityId] = allDaysInMonth.map(date => 
      activityStatsByDay[date][activityId] || 0
    );
  });
  
  return {
    activityStats: result,
    dates: allDaysInMonth
  };
}

async statisticActivity(info: PaginateInfo) {
  const { where } = info;
  try {
    const userId = where?.user_id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    // Convert user_id to number
    const parsedUserId = Number(userId);
    if (isNaN(parsedUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    // Get current time
    const now = new Date();

    // Process month and year from where condition
    let month: number;
    let year: number;
    
    if (where?.date?.month || where?.date?.year) {
      month = where.date.month ? Number(where.date.month) - 1 : now.getMonth(); // Month in JS is 0-11
      year = where.date.year ? Number(where.date.year) : now.getFullYear();
    } else {
      month = now.getMonth();
      year = now.getFullYear();
    }

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    // Get all records with their activities for the user in the specified month
    const records = await this.prismaService.record.findMany({
      where: {
        user_id: parsedUserId,
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        activities: true, // This will include activity_records properly
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Calculate activity statistics
    const activityData = this.calculateActivityStats(records, year, month);

    // Since we don't have an activity model, we'll just use the activity IDs as identifiers
    const activityIds = Object.keys(activityData.activityStats).map(Number);
    
    // Create a placeholder map for activity names (using ID as display value)
    const activityNames: Record<number, string> = {};
    activityIds.forEach(id => {
      activityNames[id] = `Activity ${id}`;
    });

    // Build final response
    return {
      monthly: {
        activityData: activityData.activityStats,
        activityIds: activityIds, // Including the IDs explicitly
        activityNames: activityNames,
        dates: activityData.dates,
        month: month + 1, // Convert to 1-12 format
        year: year,
        totalRecords: records.length
      }
    };
  } catch (error) {
    throw new BadRequestException('Error in activity statistics: ' + error.message);
  }
}
}
