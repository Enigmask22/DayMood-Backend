import {
  BadRequestException,
  Injectable,
  NotFoundException,
  // UseGuards, // Commented out if not used
} from '@nestjs/common';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
// import { InjectModel } from '@nestjs/mongoose'; // Commented out if not used
import { genSaltSync, hashSync, compareSync } from 'bcryptjs';
// import { RegisterDto } from 'src/auth/dto/create-user.dto'; // Commented out if not used
// import { IUser } from '../interface/users.interface'; // Commented out if not used
import { HttpException, HttpStatus } from '@nestjs/common';
import { PaginateInfo } from 'src/interface/paginate.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateActivityRecordDto } from './dto/create-activity-record.dto';
import {
  startOfWeek,
  addMonths,
  set,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  lastDayOfMonth,
  format as formatDate,
  getMonth,
  getYear,
  getDate,
} from 'date-fns';
import {
  toZonedTime,
  fromZonedTime,
  format as formatInTimeZone,
} from 'date-fns-tz';

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
  private getAllDaysInMonth(year: number, month: number, timeZone: string): string[] {
    const days: string[] = [];
    // Create a date in the target timezone to ensure month boundaries are correct for that zone
    const firstDayOfMonthInTz = toZonedTime(new Date(Date.UTC(year, month, 1)), timeZone);
    const actualYear = getYear(firstDayOfMonthInTz);
    const actualMonth = getMonth(firstDayOfMonthInTz);

    const startOfMonthDate = startOfMonth(new Date(actualYear, actualMonth, 1));
    const endOfMonthDate = endOfMonth(startOfMonthDate);

    const interval = { start: startOfMonthDate, end: endOfMonthDate }; // These are now local to the server's TZ or effectively naive
    const datesInMonth = eachDayOfInterval(interval);
    
    datesInMonth.forEach(date => {
      // Format the date as if it's in the target timezone for the string representation
      days.push(formatInTimeZone(fromZonedTime(date, timeZone), 'yyyy-MM-dd', { timeZone }));
      // Alternative: if `date` is already considered to be in the target timezone's "local" time for that day:
      // days.push(formatDate(date, 'yyyy-MM-dd')); 
      // For consistency, let's ensure we are formatting a date that represents the target timezone's day
      // The initial `firstDayOfMonthInTz` and subsequent `startOfMonthDate`, `endOfMonthDate` should be handled carefully.
      // Let's simplify: construct Date objects for year, month, day in UTC, then format in target TZ.
    });
    
    // Corrected approach for getAllDaysInMonth:
    const correctedDays: string[] = [];
    const firstDate = new Date(year, month, 1);
    const lastDate = lastDayOfMonth(firstDate);
    const numDays = getDate(lastDate);

    for (let day = 1; day <= numDays; day++) {
      // Create a date that represents midnight in the target timezone for that specific day
      const dateInTz = toZonedTime(Date.UTC(year, month, day), timeZone);
      correctedDays.push(formatInTimeZone(dateInTz, 'yyyy-MM-dd', { timeZone }));
    }
    return correctedDays;
  }

  private calculateDailyMoodStats(records: any[], year: number, month: number, timeZone: string) {
    const dailyStats: Record<string, Record<number, number>> = {};
    
    const allDaysInMonth = this.getAllDaysInMonth(year, month, timeZone);
    
    allDaysInMonth.forEach(date => {
      dailyStats[date] = {};
    });
    
    records.forEach(record => {
      if (record.mood_id) {
        const zonedDateTime = toZonedTime(record.date, timeZone); // record.date is UTC
        const dateStr = formatInTimeZone(zonedDateTime, 'yyyy-MM-dd', { timeZone });
        
        if (dailyStats[dateStr]) {
          dailyStats[dateStr][record.mood_id] = (dailyStats[dateStr][record.mood_id] || 0) + 1;
        }
      }
    });

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

  async statisticMood(info: PaginateInfo, timezone: string = 'UTC') {
    const { where } = info;
    try {
      const userId = where?.user_id;
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      const parsedUserId = Number(userId);
      if (isNaN(parsedUserId)) {
        throw new BadRequestException('Invalid user ID format');
      }

      const now = new Date(); // Current moment in UTC
      const nowInUserTz = toZonedTime(now, timezone);
      
      let targetMonth: number;
      let targetYear: number;

      if (where?.date?.month || where?.date?.year) {
        targetMonth = where.date.month ? Number(where.date.month) - 1 : getMonth(nowInUserTz);
        targetYear = where.date.year ? Number(where.date.year) : getYear(nowInUserTz);
      } else {
        targetMonth = getMonth(nowInUserTz);
        targetYear = getYear(nowInUserTz);
      }

      // Create the start of the month in the user's timezone (e.g., June 1st, 00:00:00 in UTC+7)
      // For this, we need a Date object that, when interpreted in UTC, represents YYYY-MM-01 00:00:00 in the target timezone.
      // So, we construct YYYY-MM-01 00:00:00 in target timezone, then convert to UTC.
      const firstDayOfMonthUserTzWallTime = new Date(targetYear, targetMonth, 1, 0, 0, 0);
      const startOfMonthUTC = fromZonedTime(firstDayOfMonthUserTzWallTime, timezone);

      // Create the end of the month in the user's timezone (e.g., June 30th, 23:59:59.999 in UTC+7)
      // This will be the start of the *next* month in user's timezone, then converted to UTC.
      const firstDayOfNextMonthUserTzWallTime = new Date(targetYear, targetMonth + 1, 1, 0, 0, 0);
      const endOfMonthExclusiveUTC = fromZonedTime(firstDayOfNextMonthUserTzWallTime, timezone);
      
      // For weekly stats: Start of the current actual week in user's timezone
      const startOfCurrentActualWeekUserTz = startOfWeek(nowInUserTz, { weekStartsOn: 0 }); // Assuming week starts on Sunday (0)
      const startOfCurrentActualWeekUTC = fromZonedTime(startOfCurrentActualWeekUserTz, timezone);

      const records = await this.prismaService.record.findMany({
        where: {
          user_id: parsedUserId,
          date: { // Dates in DB are UTC
            gte: startOfMonthUTC,
            lt: endOfMonthExclusiveUTC, // Use `lt` with the start of the next month
          },
        },
        select: {
          mood_id: true,
          date: true, // This date is in UTC
        },
        orderBy: {
          date: 'desc',
        },
      });

      const weeklyRecords = records.filter(record => record.date >= startOfCurrentActualWeekUTC);
      const monthlyRecords = records;

      const weeklyMoodStats = this.calculateMoodStats(weeklyRecords);
      const monthlyMoodStats = this.calculateMoodStats(monthlyRecords);
      const dailyMoodStats = this.calculateDailyMoodStats(monthlyRecords, targetYear, targetMonth, timezone);

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
          month: targetMonth + 1, 
          year: targetYear,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Lỗi khi thống kê mood: ' + error.message);
    }
  }

private calculateActivityStats(records: any[], year: number, month: number, timeZone: string) {
  const activityStatsByDay: Record<string, Record<number, number>> = {};
  
  const allDaysInMonth = this.getAllDaysInMonth(year, month, timeZone);
  
  allDaysInMonth.forEach(date => {
    activityStatsByDay[date] = {};
  });
  
  records.forEach(record => {
    if (record.activities && record.activities.length > 0) {
      const zonedDateTime = toZonedTime(record.date, timeZone); // record.date is UTC
      const dateStr = formatInTimeZone(zonedDateTime, 'yyyy-MM-dd', { timeZone });
      
      if (activityStatsByDay[dateStr]) {
        record.activities.forEach(activityRecord => {
          const activityId = activityRecord.activity_id;
          activityStatsByDay[dateStr][activityId] = (activityStatsByDay[dateStr][activityId] || 0) + 1;
        });
      }
    }
  });
  
  const result: Record<number, number[]> = {};
  const allActivityIds = new Set<number>();
  Object.values(activityStatsByDay).forEach(dayStats => {
    Object.keys(dayStats).forEach(activityId => {
      allActivityIds.add(Number(activityId));
    });
  });
  
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

async statisticActivity(info: PaginateInfo, timezone: string = 'UTC') {
  const { where } = info;
  try {
    const userId = where?.user_id;
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    const parsedUserId = Number(userId);
    if (isNaN(parsedUserId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const now = new Date();
    const nowInUserTz = toZonedTime(now, timezone);
    let targetMonth: number;
    let targetYear: number;
    
    if (where?.date?.month || where?.date?.year) {
      targetMonth = where.date.month ? Number(where.date.month) - 1 : getMonth(nowInUserTz);
      targetYear = where.date.year ? Number(where.date.year) : getYear(nowInUserTz);
    } else {
      targetMonth = getMonth(nowInUserTz);
      targetYear = getYear(nowInUserTz);
    }

    const firstDayOfMonthUserTzWallTime = new Date(targetYear, targetMonth, 1, 0, 0, 0);
    const startOfMonthUTC = fromZonedTime(firstDayOfMonthUserTzWallTime, timezone);

    const firstDayOfNextMonthUserTzWallTime = new Date(targetYear, targetMonth + 1, 1, 0, 0, 0);
    const endOfMonthExclusiveUTC = fromZonedTime(firstDayOfNextMonthUserTzWallTime, timezone);

    // First get all unique activity IDs ever used by this user
    const allUserActivityIds = await this.prismaService.activityRecord.findMany({
      where: {
        record: {
          user_id: parsedUserId
        }
      },
      select: {
        activity_id: true
      },
      distinct: ['activity_id']
    });

    // Extract unique activity IDs into an array
    const activityIds: number[] = [];
    allUserActivityIds.forEach(item => {
      activityIds.push(item.activity_id);
    });

    // Get current month's records
    const records = await this.prismaService.record.findMany({
      where: {
        user_id: parsedUserId,
        date: {
          gte: startOfMonthUTC,
          lt: endOfMonthExclusiveUTC,
        },
      },
      select: {
        date: true,
        activities: { 
          select: {
            activity_id: true,
          }
        } 
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Calculate activity stats for the current month with the records
    const activityStatsResult = this.calculateActivityStats(records, targetYear, targetMonth, timezone);
    
    // Get the days in month array
    const allDaysInMonth = activityStatsResult.dates;
    
    // Ensure all activities are included in the result
    const activityData = { ...activityStatsResult.activityStats };
    
    // Create activity names (placeholder)
    const activityNames: { [key: string]: string } = {};
    
    // Add any missing activities with arrays of zeros
    activityIds.forEach(activityId => {
      if (!activityData[activityId]) {
        activityData[activityId] = Array(allDaysInMonth.length).fill(0);
      }
      // Add placeholder name for each activity
      activityNames[activityId] = `Activity ${activityId}`;
    });

    return {
      monthly: {
        activityData: activityData,
        activityIds: activityIds,
        activityNames: activityNames,
        dates: allDaysInMonth,
        month: targetMonth + 1,
        year: targetYear,
        totalRecords: records.length
      }
    };
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException('Lỗi khi thống kê activity: ' + error.message);
  }
}
}
