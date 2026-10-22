import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN',
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}
