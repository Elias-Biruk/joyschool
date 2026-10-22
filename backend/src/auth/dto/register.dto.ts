import { 
  IsEmail, 
  IsString, 
  MinLength, 
  MaxLength, 
  Matches, 
  IsOptional, 
  IsIn,
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@ValidatorConstraint({ name: 'isEmailUnique', async: true })
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  async validate(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return !user;
    } catch {
      return true; // If DB check fails, allow validation to proceed
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'An account with this email already exists';
  }
}

export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailUniqueConstraint,
    });
  };
}

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsEmailUnique({ message: 'An account with this email already exists' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @IsString()
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must not exceed 50 characters' })
  firstName: string;

  @IsString()
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must not exceed 50 characters' })
  lastName: string;

  @IsOptional()
  @IsString()
  @IsIn(['STUDENT', 'TEACHER', 'ADMIN'], { message: 'Invalid role selected' })
  role?: string;
}
