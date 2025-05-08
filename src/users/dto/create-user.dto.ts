import { IsEmail, IsNotEmpty, IsEnum, IsOptional, IsInt, IsString } from 'class-validator';
import { UserGender, UserRole } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    required: true
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password',
    required: true
  })
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Username',
    required: true
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: '0123456789',
    description: 'User phone number',
    required: false
  })
  @IsOptional()
  @IsString()
  phone: string;

  @ApiProperty({
    example: 'Hanoi, Vietnam',
    description: 'User address',
    required: false
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({
    example: 25,
    description: 'User age',
    required: false,
    type: 'integer'
  })
  @IsOptional()
  @IsInt()
  age: number;

  @ApiProperty({
    enum: UserGender,
    example: 'MALE',
    description: 'User gender',
    required: false,
    enumName: 'UserGender'
  })
  @IsEnum(UserGender)
  @IsOptional()
  gender: UserGender;
}