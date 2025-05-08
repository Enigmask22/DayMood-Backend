import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
} from 'class-validator';
import { UserRole, UserGender } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'anonymous@gmail.com',
    description: 'User email address',
    required: true,
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456abc',
    description: 'User password',
    required: true,
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'anonymous',
    description: 'Unique username',
    required: true,
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'Hà Nội',
    description: 'User address',
    required: false,
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({
    example: 25,
    description: 'User age',
    required: false,
    type: 'integer',
  })
  @IsInt()
  @IsOptional()
  age: number;

  @ApiProperty({
    example: '0912345678',
    description: 'User phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  phone: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.USER,
    description: 'User role',
    default: UserRole.USER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role: UserRole;

  @ApiProperty({
    enum: UserGender,
    example: UserGender.MALE,
    description: 'User gender',
    default: UserGender.MALE,
    required: false,
  })
  @IsEnum(UserGender)
  @IsOptional()
  gender: UserGender;
}
