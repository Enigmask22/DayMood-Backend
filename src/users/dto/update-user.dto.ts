import { OmitType, PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// First omit the password field, then make all remaining fields optional
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const)
) {
  @ApiProperty({
    example: 'currentPassword123',
    description: 'Current password for verification',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password (optional)',
    required: false
  })
  @IsOptional()
  @IsString()
  updatePassword?: string;
}