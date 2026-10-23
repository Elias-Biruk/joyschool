import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleTokenDto } from './dto/google-auth.dto';
import { EmailService } from '../email/email.service';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (clientId) {
      this.googleClient = new OAuth2Client(clientId);
    }
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);
    
    // Send verification email
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 86400000); // 24 hours
    await this.usersService.setEmailVerificationToken(user.id, token, expires);
    await this.emailService.sendVerificationEmail(user.email, token);

    const tokens = await this.generateTokens(user);
    return {
      user,
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Please use Google sign-in for this account');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is suspended');
    }

    await this.usersService.updateLastLogin(user.id);

    const tokens = await this.generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio,
        emailVerified: user.emailVerified,
        onboardingCompleted: user.onboardingCompleted,
      },
      ...tokens,
    };
  }

  async googleAuth(googleTokenDto: GoogleTokenDto) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    
    if (!clientId || !this.googleClient) {
      throw new UnauthorizedException('Google authentication is not configured. Please use email/password registration.');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleTokenDto.idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { sub, email, email_verified, given_name, family_name, picture } = payload;

      if (!email) {
        throw new UnauthorizedException('Email is required from Google');
      }

      // Check if user exists with this Google identity
      let user = await this.usersService.findByProvider('google', sub);

      if (user) {
        // Existing Google user - sign them in
        if (!user.isActive) {
          throw new UnauthorizedException('Account is suspended');
        }

        await this.usersService.updateLastLogin(user.id);
        const tokens = await this.generateTokens(user);

        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            avatar: user.avatar,
            bio: user.bio,
            emailVerified: user.emailVerified,
            onboardingCompleted: user.onboardingCompleted,
          },
          ...tokens,
        };
      }

      // Check if user exists with this email (potential account linking)
      user = await this.usersService.findByEmail(email);

      if (user) {
        // Email already registered - could implement account linking here
        // For now, require separate account or user to link manually
        throw new ConflictException('An account with this email already exists. Please sign in with your password.');
      }

      // Create new user from Google
      const newUser = await this.usersService.createWithGoogle({
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        provider: 'google',
        providerId: sub,
        avatar: picture,
        emailVerified: email_verified || false,
      });

      const tokens = await this.generateTokens(newUser);

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          avatar: newUser.avatar,
          bio: newUser.bio,
          emailVerified: newUser.emailVerified,
          onboardingCompleted: newUser.onboardingCompleted,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof ConflictException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByEmailVerificationToken(token);
    
    if (!user) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    await this.usersService.verifyEmail(user.id);
    
    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a verification link has been sent' };
    }

    if (user.emailVerified) {
      return { message: 'Email is already verified' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 86400000); // 24 hours
    await this.usersService.setEmailVerificationToken(user.id, token, expires);
    await this.emailService.sendVerificationEmail(user.email, token);
    
    return { message: 'If the email exists, a verification link has been sent' };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    if (!user.passwordHash) {
      // Google account - cannot reset password
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.setPasswordResetToken(user.id, token, expires);
    await this.emailService.sendPasswordResetEmail(user.email, token);
    
    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByPasswordResetToken(resetPasswordDto.token);
    
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.usersService.updatePassword(user.id, resetPasswordDto.newPassword);
    
    return { message: 'Password reset successfully' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      const tokens = await this.generateTokens(user);
      return tokens;
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'default-refresh-secret',
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d') as any,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
