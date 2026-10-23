import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompleteOnboardingDto } from './dto/onboarding.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

interface CreateWithGoogleDto {
  email: string;
  firstName: string;
  lastName: string;
  provider: string;
  providerId: string;
  avatar?: string;
  emailVerified: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(registerDto: RegisterDto) {
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        passwordHash,
        role: (registerDto.role as Role) || Role.STUDENT,
        provider: 'email',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    return user;
  }

  async createWithGoogle(createWithGoogleDto: CreateWithGoogleDto) {
    const user = await this.prisma.user.create({
      data: {
        email: createWithGoogleDto.email,
        firstName: createWithGoogleDto.firstName,
        lastName: createWithGoogleDto.lastName,
        provider: createWithGoogleDto.provider,
        providerId: createWithGoogleDto.providerId,
        avatar: createWithGoogleDto.avatar,
        emailVerified: createWithGoogleDto.emailVerified,
        role: Role.STUDENT,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
      },
    });

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByProvider(provider: string, providerId: string) {
    return this.prisma.user.findFirst({
      where: {
        provider,
        providerId,
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        onboardingCompleted: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        onboardingCompleted: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async completeOnboardingProfile(id: string, onboardingDto: CompleteOnboardingDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.onboardingCompleted) {
      throw new BadRequestException('Onboarding already completed');
    }

    // Prevent users from assigning themselves admin role
    if (onboardingDto.role === Role.ADMIN) {
      throw new BadRequestException('Cannot assign admin role during onboarding');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        role: onboardingDto.role,
        bio: onboardingDto.bio,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        bio: true,
        isActive: true,
        emailVerified: true,
        onboardingCompleted: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updatePassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  async setPasswordResetToken(id: string, token: string, expires: Date) {
    await this.prisma.user.update({
      where: { id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });
  }

  async findByPasswordResetToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
      },
    });

    return user;
  }

  async setEmailVerificationToken(id: string, token: string, expires: Date) {
    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpires: expires,
      },
    });
  }

  async findByEmailVerificationToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
      },
    });

    return user;
  }

  async verifyEmail(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }

  async updateLastLogin(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async completeOnboarding(id: string) {
    await this.prisma.user.update({
      where: { id },
      data: { onboardingCompleted: true },
    });
  }
}
