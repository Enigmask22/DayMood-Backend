import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';

export class UserLoginDto {
  @IsString()
  @IsEmail()
  @IsOptional()
  @ApiProperty({
    example: 'user@example.com',
    description: 'email',
    required: false
  })
  readonly email?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'password123',
    description: 'password',
    required: false
  })
  readonly password?: string;
}
