import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPasswordDto {
  @ApiProperty({
    description: 'User password to verify',
    example: 'password123'
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
