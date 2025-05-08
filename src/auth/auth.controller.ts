import {
  Post,
  UseGuards,
  Controller,
  Get,
  Body,
  Res,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  GetPaginateInfo,
  Public,
  ResponseMessage,
  User,
} from 'src/decorator/customize';
import { LocalAuthGuard } from './local-auth.guard';
import { IUser } from 'src/interface/users.interface';
import { UniqueGmail } from './gmail.guard';
import { Request, Response } from 'express';
import { ApiBody, ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';
import { RegisterDto } from './dto/create-user.dto';
import { UserLoginDto } from 'src/users/dto/login-user.dto';
import { UsersService } from 'src/users/users.service';
import { UnauthorizedResponseSchema } from 'src/core/transform.interceptor';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate a user with email and password to get access token'
  })
  @ApiBody({ 
    type: UserLoginDto,
    description: 'User credentials',
    examples: {
      validExample: {
        summary: 'Valid login example',
        value: {
          email: 'user@example.com',
          password: 'password123'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Login successful',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Login successfully.' },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { 
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                email: { type: 'string', example: 'user@example.com' },
                username: { type: 'string', example: 'johndoe' },
                role: { type: 'string', example: 'USER' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid credentials',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
        error: { type: 'string', example: 'Invalid credentials' }
      }
    }
  })
  @UseGuards(LocalAuthGuard)
  @ResponseMessage('Login successfully.')
  @Post('login')
  handleLogin(
    @User() user: IUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.login(user, response);
  }

  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get the authenticated user profile information'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Get profile successfully.' },
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
            avatar: { type: 'string', example: 'https://example.com/avatar.png' },
            createdAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' },
            updatedAt: { type: 'string', example: '2023-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401,
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @ApiBearerAuth('token')
  @Get('account')
  @ResponseMessage('Get profile successfully.')
  getProfile(@User() user: IUser) {
    return this.usersService.findOne(user.id);
  }

  @Public()
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user with required information'
  })
  @ApiBody({ 
    type: RegisterDto,
    description: 'User registration data',
    examples: {
      validExample: {
        summary: 'Valid registration example',
        value: {
          email: 'newuser@example.com',
          password: 'password123',
          username: 'newuser',
          gender: 'MALE'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Registration successful',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 201 },
        message: { type: 'string', example: 'Register successfully.' },
        data: { 
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'newuser@example.com' },
            username: { type: 'string', example: 'newuser' }
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
  @UseGuards(UniqueGmail)
  @Post('register')
  @ResponseMessage('Register successfully.')
  handleRegister(@Body() regiterDto: RegisterDto) {
    return this.authService.register(regiterDto);
  }

  @Public()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Get a new access token using the refresh token stored in cookies'
  })
  @ApiCookieAuth()
  @ApiResponse({ 
    status: 200, 
    description: 'Token refreshed successfully',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Get profile by refresh token.' },
        data: {
          type: 'object',
          properties: {
            access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { 
              type: 'object',
              properties: {
                id: { type: 'number', example: 1 },
                email: { type: 'string', example: 'user@example.com' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized - Invalid or expired refresh token',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Refresh token is invalid or expired' }
      }
    }
  })
  @Get('refresh')
  @ResponseMessage('Get profile by refresh token.')
  hanldeRefreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.authService.processNewToken(request, response);
  }

  @ApiOperation({
    summary: 'User logout',
    description: 'Logout the currently authenticated user and clear cookies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Logout successful',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 200 },
        message: { type: 'string', example: 'Log out successfully.' }
      }
    }
  })
  @ApiResponse({ 
    status: 401,
    description: 'Unauthorized - Invalid token or missing authentication',
    schema: UnauthorizedResponseSchema
  })
  @ApiBearerAuth('token')
  @Get('logout')
  @ResponseMessage('Log out successfully.')
  handleLogout(@Res({ passthrough: true }) response: Response) {
    return this.authService.logout(response);
  }
}
