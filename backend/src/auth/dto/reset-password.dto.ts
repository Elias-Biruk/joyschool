import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
