import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/interface/users.interface';
import { RegisterDto } from './dto/create-user.dto';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import ms from 'ms';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // username and password are passed from the login method
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user) {
      const isValid = this.usersService.isValidPasword(pass, user.password);
      if (isValid) {
        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        };
      }
    }
    return null;
  }

  createRefreshToken(payload: any) {
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRE'),
    });
    return refreshToken;
  }

  async login(user: IUser, response: Response) {
    const { id, email, username, role } = user;
    const payload = {
      sub: 'token login',
      iss: 'from server',
      id,
      email,
      username,
      role,
    };

    const refreshToken = this.createRefreshToken(payload);

    // set refresh token as cookie
    response.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id,
        email,
        username,
      },
    };
  }

  async register(regiterDto: RegisterDto) {
    const newUser = await this.usersService.register(regiterDto);
    return {
      id: newUser.id,
      email: newUser.email,
      created_time: newUser.created_time,
    };
  }

  async processNewToken(request: Request, response: Response) {
    try {
      // Extract refresh token from cookies
      const refreshToken = request.cookies['refresh_token'];

      // Validate if refresh token exists
      if (!refreshToken) {
        throw new BadRequestException('Refresh token not provided');
      }

      // Verify the refresh token
      let decoded: IUser;
      try {
        decoded = this.jwtService.verify(refreshToken, {
          secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        });
      } catch (jwtError) {
        throw new BadRequestException('Expired or invalid refresh token');
      }

      // Find the user associated with this refresh token
      const user = await this.usersService.findOne(decoded.id);

      if (!user) {
        throw new BadRequestException('User not found or token revoked');
      }

      // Create payload for new tokens
      const { id, email, username, role } = user;
      const payload = {
        sub: 'token refresh',
        iss: 'from server',
        id,
        email,
        username,
        role,
      };

      // Generate new tokens
      const newAccessToken = this.jwtService.sign(payload);
      const newRefreshToken = this.createRefreshToken(payload);;

      // Set the new refresh token in cookies
      response.clearCookie('refresh_token');
      response.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: true,
        // this.configService.get<string>('NODE_ENV') !== 'development', // Only secure in production
        sameSite: 'none',
        maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
      });

      // Return new access token and user info
      return {
        access_token: newAccessToken,
        user: {
          id,
          email,
          username,
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Log unexpected errors
      console.error('Token refresh error:', error);
      throw new BadRequestException('Error processing refresh token');
    }
  }

  async logout(response: Response) {
    // await this.usersService.updateUserToken(user.id, '');
    response.clearCookie('refresh_token');
    return null;
  }
}
