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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UseGuards } from '@nestjs/common';
import {
  GetPaginateInfo,
  Public,
  ResponseMessage,
  User,
} from 'src/decorator/customize';
import { IUser } from '../interface/users.interface';
import { UniqueGmail } from 'src/auth/gmail.guard';
import { checkValidId } from 'src/core/id.guard';
import { PaginateInfo } from 'src/interface/paginate.interface';
import { ApiQuery, ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ForbiddenResponseSchema, UnauthorizedResponseSchema } from 'src/core/transform.interceptor';
import { VerifyPasswordDto } from './dto/verify-password.dto';

@ApiTags('users')
@ApiBearerAuth('token')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({
    summary: 'Create a new user',
    description: 'Create a new user with provided data, use admin account to use this API, email: "admin@example.com", password: "admin" '
  })
  @ApiBody({
    type: CreateUserDto,
    description: 'User data to create'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Create a user' },
        data: { 
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'newuser@example.com' },
            username: { type: 'string', example: 'newuser' },
            role: { type: 'string', example: 'USER' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Email already exists or validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Email already exists' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have admin permissions',
    schema: ForbiddenResponseSchema
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @Post()
  @UseGuards(UniqueGmail)
  @ResponseMessage('Create a user')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({
    summary: 'Get all users with pagination',
    description: 'Retrieve a list of users with pagination support, use admin account to use this API, email: "admin@example.com", password: "admin" '
  })
  @ApiQuery({ 
    name: 'page', 
    description: 'Page number', 
    type: Number, 
    required: false,
    example: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    description: 'Number of items per page', 
    type: Number, 
    required: false,
    example: 10
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Get a list of users' },
        data: { 
          type: 'object',
          properties: {
            meta: { 
              type: 'object',
              properties: {
                page: { type: 'number', example: 1 },
                limit: { type: 'number', example: 10 },
                total: { type: 'number', example: 50 },
                totalPages: { type: 'number', example: 5 }
              }
            },
            items: { 
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  email: { type: 'string', example: 'user@example.com' },
                  username: { type: 'string', example: 'johndoe' },
                  phone: { type: 'string', example: '0123456789' },
                  address: { type: 'string', example: 'Hanoi, Vietnam' },
                  age: { type: 'number', example: 25 },
                  gender: { type: 'string', example: 'MALE' },
                  role: { type: 'string', example: 'USER' },
                  createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
                  updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have admin permissions',
    schema: ForbiddenResponseSchema
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @Get()
  @ResponseMessage('Get a list of users')
  findAll(@GetPaginateInfo() info: PaginateInfo) {
    return this.usersService.findAll(info);
  }

  @ApiOperation({
    summary: 'Get a user by ID',
    description: 'Retrieve a single user by providing their ID, use admin account to use this API, email: "admin@example.com", password: "admin"'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user',
    type: Number,
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found and returned successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Get a user' },
        data: { 
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'johndoe' },
            phone: { type: 'string', example: '0123456789' },
            address: { type: 'string', example: 'Hanoi, Vietnam' },
            age: { type: 'number', example: 25 },
            gender: { type: 'string', example: 'MALE' },
            role: { type: 'string', example: 'USER' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have admin permissions',
    schema: ForbiddenResponseSchema
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @Get(':id')
  @UseGuards(checkValidId)
  @ResponseMessage('Get a user')
  findOne(@Param('id') id: number) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({
    summary: 'Update a user',
    description: 'Update a user\'s information by ID'
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to update',
    type: Number,
    example: 1
  })
  @ApiBody({
    type: UpdateUserDto,
    description: 'User data to update'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Update a user' },
        data: { 
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'updateduser' },
            phone: { type: 'string', example: '0987654321' },
            address: { type: 'string', example: 'Ho Chi Minh City, Vietnam' },
            age: { type: 'number', example: 30 },
            gender: { type: 'string', example: 'FEMALE' },
            role: { type: 'string', example: 'USER' },
            updatedAt: { type: 'string', example: '2023-01-02T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have admin permissions',
    schema: ForbiddenResponseSchema
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Insufficient permissions or invalid data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'You cannot update information of another user' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @Patch(':id')
  @UseGuards(checkValidId)
  @ResponseMessage('Update a user')
  update(@Param('id') id: number, @Body() updateUserDto: UpdateUserDto, @User() user: IUser) {
    return this.usersService.update(id, user, updateUserDto);
  }

  @ApiOperation({
    summary: 'Delete a user',
    description: 'Soft delete a user by moving them to trash, use admin account to use this API, email: "admin@example.com", password: "admin" '
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the user to delete',
    type: Number,
    example: 1
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Take a user to trash' },
        data: { 
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            deleted: { type: 'boolean', example: true },
            deletedAt: { type: 'string', example: '2023-01-02T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'User not found' }
      }
    }
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - User does not have admin permissions',
    schema: ForbiddenResponseSchema
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @Delete(':id')
  @UseGuards(checkValidId)
  @ResponseMessage('Take a user to trash')
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }

  @ApiOperation({
    summary: 'Verify user password',
    description: 'Verify if the provided password matches the current user\'s password'
  })
  @ApiBody({
    type: VerifyPasswordDto,
    description: 'Password to verify'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password verification successful',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Password verified successfully' },
        data: { 
          type: 'object',
          properties: {
            verified: { type: 'boolean', example: true }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid password',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'string', example: 'Invalid password' },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @Post('verify-password')
  @ResponseMessage('Password verified successfully')
  verifyPassword(@Body() verifyPasswordDto: VerifyPasswordDto, @User() user: IUser) {
    return this.usersService.verifyPassword(verifyPasswordDto.password, user);
  }
}
