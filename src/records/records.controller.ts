import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Version,
  VERSION_NEUTRAL,
  ParseIntPipe,
  Res,
} from '@nestjs/common';
import { RecordsService } from './records.service';
import { CreateRecordDto } from './dto/create-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
//import { UseGuards } from '@nestjs/common';
import {
  GetPaginateInfo,
  Public,
  ResponseMessage,
} from 'src/decorator/customize';
import { PaginateInfo } from 'src/interface/paginate.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CreateActivityRecordDto } from './dto/create-activity-record.dto';

@ApiTags('records')
@ApiBearerAuth('token')
@Controller({ path: 'records', version: '1' })
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Create a new record',
    description: 'Creates a new mood record in the system',
  })
  @ApiBody({
    type: CreateRecordDto,
    description: 'User data to create',
  })
  @ApiResponse({
    status: 201,
    description: 'Create a record successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Create a record' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: 'Một ngày đẹp trời' },
              content: {
                type: 'string',
                example: 'Đã làm được rất nhiều công việc.',
              },
              status: { type: 'string', example: 'ACTIVE' },
              created_time: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
              updated_time: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
              mood_id: { type: 'number', example: 12 },
              user_id: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', example: ['title must be a string'] },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ResponseMessage('Create a record')
  create(@Body() createRecordDto: CreateRecordDto) {
    return this.recordsService.create(createRecordDto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary: 'Get all records',
    description: 'Retrieves a paginated list of records filtered by user_id',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'user_id',
    required: true,
    description: 'User ID for filtering records',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'List of records retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Get a list of records' },
        data: {
          type: 'object',
          properties: {
            meta: {
              type: 'object',
              properties: {
                totalRecords: { type: 'number', example: 1 },
                recordsPerPage: { type: 'number', example: 10 },
                totalPages: { type: 'number', example: 1 },
                currentPage: { type: 'number', example: 1 },
              },
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  title: { type: 'string', example: 'Một ngày đẹp trời' },
                  content: {
                    type: 'string',
                    example: 'Đã làm được rất nhiều công việc.',
                  },
                  status: { type: 'string', example: 'ACTIVE' },
                  created_time: {
                    type: 'string',
                    example: '2023-01-01T00:00:00.000Z',
                  },
                  updated_time: {
                    type: 'string',
                    example: '2023-01-01T00:00:00.000Z',
                  },
                  date: {
                    type: 'string',
                    example: '2025-05-01T13:38:00.000Z',
                  },
                  mood_id: { type: 'number', example: 12 },
                  user_id: { type: 'number', example: 1 },
                },
              },
            },
          },
        },
      },
    },
  })
  @ResponseMessage('Get a list of records')
  findAll(
    @GetPaginateInfo() info: PaginateInfo,
    @Query('user_id') userId: string,
  ) {
    // Đảm bảo user_id nằm trong where condition
    if (!info.where) {
      info.where = {};
    }

    if (userId) {
      info.where.user_id = parseInt(userId);
    }

    return this.recordsService.findAll(info);
  }

  @Public()
  @Get('statistic/mood')
  @ApiOperation({
    summary: 'Get mood statistics',
    description: 'Retrieves mood statistics for a user, filterable by month and year, adjusted for timezone.',
  })
  @ApiQuery({
    name: 'user_id',
    required: true,
    description: 'User ID for filtering records',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month for statistics (1-12)',
    type: Number,
    example: new Date().getMonth() + 1,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year for statistics',
    type: Number,
    example: new Date().getFullYear(),
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    description: "Timezone string (e.g., 'America/New_York', 'Asia/Ho_Chi_Minh', 'UTC')",
    type: String,
    example: 'UTC',
  })
  @ResponseMessage('Get mood statistics')
  statisticMood(
    @Query('user_id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('timezone') timezone?: string,
  ) {
    // Initialize PaginateInfo with default values for fields not strictly needed by this endpoint,
    // but required by the interface.
    const info: PaginateInfo = {
      where: {},
      page: 1, // Default or unused
      skip: 0, // Default or unused
      take: 10, // Default or unused
      orderBy: undefined, // Default or unused
      select: undefined, // Default or unused
      include: undefined, // Default or unused
    };

    if (!userId) {
      // The service method will throw a BadRequestException if userId is missing.
    }
    // The service method will parse userId to a number and handle potential NaN.
    info.where.user_id = userId;

    if (month || year) {
      info.where.date = {};
      if (month) {
        // The service method will parse month to a number and handle potential NaN.
        info.where.date.month = month;
      }
      if (year) {
        // The service method will parse year to a number and handle potential NaN.
        info.where.date.year = year;
      }
    }
    return this.recordsService.statisticMood(info, timezone);
  }

  @Public()
  @Get('statistic/activity')
  @ApiOperation({
    summary: 'Get activity statistics',
    description: 'Retrieves activity statistics for a user, filterable by month and year, adjusted for timezone.',
  })
  @ApiQuery({
    name: 'user_id',
    required: true,
    description: 'User ID for filtering records',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'month',
    required: false,
    description: 'Month for statistics (1-12)',
    type: Number,
    example: new Date().getMonth() + 1,
  })
  @ApiQuery({
    name: 'year',
    required: false,
    description: 'Year for statistics',
    type: Number,
    example: new Date().getFullYear(),
  })
  @ApiQuery({
    name: 'timezone',
    required: false,
    description: "Timezone string (e.g., 'America/New_York', 'Asia/Ho_Chi_Minh', 'UTC')",
    type: String,
    example: 'UTC',
  })
  @ResponseMessage('Get activity statistics')
  statisticActivity(
    @Query('user_id') userId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('timezone') timezone?: string,
  ) {
    const info: PaginateInfo = {
      where: {},
      page: 1, 
      skip: 0, 
      take: 10, 
      orderBy: undefined, 
      select: undefined, 
      include: undefined,
    };

    if (!userId) {
      // Service will handle this
    }
    info.where.user_id = userId;

    if (month || year) {
      info.where.date = {};
      if (month) {
        info.where.date.month = month;
      }
      if (year) {
        info.where.date.year = year;
      }
    }
    return this.recordsService.statisticActivity(info, timezone);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Get a record by ID',
    description:
      'Retrieves a specific record by its ID and filters by user_id if provided',
  })
  @ApiParam({
    name: 'id',
    description: 'Record ID',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'user_id',
    required: false,
    description: 'User ID for filtering record',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Record retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Get a record' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'Một ngày đẹp trời' },
            content: {
              type: 'string',
              example: 'Đã làm được rất nhiều công việc.',
            },
            status: { type: 'string', example: 'ACTIVE' },
            created_time: {
              type: 'string',
              example: '2023-01-01T00:00:00.000Z',
            },
            updated_time: {
              type: 'string',
              example: '2023-01-01T00:00:00.000Z',
            },
            date: {
              type: 'string',
              example: '2025-05-01T13:38:00.000Z',
            },
            mood_id: { type: 'number', example: 12 },
            user_id: { type: 'number', example: 1 },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activity_id: { type: 'number', example: 1 },
                  record_id: { type: 'number', example: 1 },
                },
              },
            },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  fname: { type: 'string', example: 'image.jpg' },
                  url: {
                    type: 'string',
                    example: 'https://example.com/image.jpg',
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Record not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Record not found' },
      },
    },
  })
  @ResponseMessage('Get a record')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('user_id') userId?: string,
  ) {
    return this.recordsService.findOne(
      id,
      userId ? parseInt(userId) : undefined,
    );
  }

  @Public()
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a record',
    description:
      'Updates an existing record by ID including activities and files',
  })
  @ApiParam({
    name: 'id',
    description: 'Record ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: UpdateRecordDto,
    description: 'Record data to update, including activities and files',
  })
  @ApiResponse({
    status: 200,
    description: 'Record updated successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Update a record' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            title: { type: 'string', example: 'Một ngày đẹp trời' },
            content: {
              type: 'string',
              example: 'Đã làm được rất nhiều công việc.',
            },
            status: { type: 'string', example: 'ACTIVE' },
            created_time: {
              type: 'string',
              example: '2023-01-01T00:00:00.000Z',
            },
            updated_time: {
              type: 'string',
              example: '2023-01-01T00:00:00.000Z',
            },
            date: {
              type: 'string',
              example: '2025-05-01T13:38:00.000Z',
            },
            mood_id: { type: 'number', example: 5 },
            user_id: { type: 'number', example: 1 },
            activities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  activity_id: { type: 'number', example: 2 },
                  record_id: { type: 'number', example: 1 },
                  created_time: {
                    type: 'string',
                    example: '2025-04-30T15:24:58.032Z',
                  },
                },
              },
            },
            files: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 8 },
                  fname: { type: 'string', example: 'image.jpg' },
                  type: { type: 'string', example: 'image/jpeg' },
                  url: {
                    type: 'string',
                    example: 'https://example.com/image.jpg',
                  },
                  fkey: { type: 'string', example: 'files/image.jpg' },
                  size: { type: 'string', example: '41987.59124087591' },
                  duration: { type: 'string', example: '00:30' },
                  record_id: { type: 'number', example: 1 },
                  user_id: { type: 'number', example: 1 },
                  created_time: {
                    type: 'string',
                    example: '2025-04-30T15:24:59.296Z',
                  },
                  updated_time: {
                    type: 'string',
                    example: '2025-04-30T15:24:59.296Z',
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Lỗi khi cập nhật record' },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Record not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Không tìm thấy record với ID: 1' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  })
  @ResponseMessage('Update a record')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRecordDto: UpdateRecordDto,
  ) {
    return this.recordsService.update(id, updateRecordDto);
  }

  @Public()
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a record',
    description: 'Sends a record to trash',
  })
  @ApiParam({
    name: 'id',
    description: 'Record ID',
    type: Number,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Record deleted successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Take a record to trash' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              title: { type: 'string', example: 'Một ngày đẹp trời' },
              content: {
                type: 'string',
                example: 'Đã làm được rất nhiều công việc.',
              },
              status: { type: 'string', example: 'ACTIVE' },
              created_time: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
              updated_time: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
              mood_id: { type: 'number', example: 12 },
              user_id: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Record not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Record not found' },
      },
    },
  })
  @ResponseMessage('Take a record to trash')
  remove(@Param('id') id: number) {
    return this.recordsService.remove(+id);
  }

  @Public()
  @Post(':id/activities')
  @ApiOperation({
    summary: 'Thêm activities cho record',
    description: 'Thêm danh sách activities cho một record cụ thể',
  })
  @ApiParam({
    name: 'id',
    description: 'Record ID',
    type: Number,
    example: 1,
  })
  @ApiBody({
    type: CreateActivityRecordDto,
    description: 'Danh sách activity IDs để thêm vào record',
  })
  @ApiResponse({
    status: 201,
    description: 'Thêm activities thành công',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Thêm activities thành công' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              activity_id: { type: 'number', example: 1 },
              record_id: { type: 'number', example: 1 },
              created_time: {
                type: 'string',
                example: '2023-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
  })
  @ResponseMessage('Thêm activities thành công')
  addActivities(
    @Param('id', ParseIntPipe) id: number,
    @Body() createActivityRecordDto: CreateActivityRecordDto,
  ) {
    return this.recordsService.addActivities(id, createActivityRecordDto);
  }
}


