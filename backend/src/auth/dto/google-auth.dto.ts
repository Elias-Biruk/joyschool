import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleCallbackDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class GoogleTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
