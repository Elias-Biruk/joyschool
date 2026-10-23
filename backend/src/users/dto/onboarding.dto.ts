import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class CompleteOnboardingDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  gradeLevel?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  school?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  expertise?: string;
}
