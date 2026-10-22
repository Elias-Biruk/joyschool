import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface FailedLoginAttempt {
  email: string;
  ip: string;
  timestamp: Date;
}

@Injectable()
export class FailedLoginTrackerService {
  private failedAttempts = new Map<string, FailedLoginAttempt[]>();
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(private prisma: PrismaService) {}

  async recordFailedAttempt(email: string, ip: string): Promise<void> {
    const attempts = this.failedAttempts.get(email) || [];
    attempts.push({ email, ip, timestamp: new Date() });
    this.failedAttempts.set(email, attempts);

    // Clean up old attempts (older than lockout duration)
    const recentAttempts = attempts.filter(
      (a) => Date.now() - a.timestamp.getTime() < this.LOCKOUT_DURATION,
    );
    this.failedAttempts.set(email, recentAttempts);

    // Log to database for audit trail
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_ATTEMPT' as any,
          entityType: 'User',
          entityId: email,
          details: { ip, attemptCount: recentAttempts.length, success: false },
          performedBy: 'SYSTEM',
        },
      });
    } catch (error) {
      console.error('Failed to log failed login attempt:', error);
    }
  }

  async clearFailedAttempts(email: string): Promise<void> {
    this.failedAttempts.delete(email);
  }

  isAccountLocked(email: string): boolean {
    const attempts = this.failedAttempts.get(email) || [];
    const recentAttempts = attempts.filter(
      (a) => Date.now() - a.timestamp.getTime() < this.LOCKOUT_DURATION,
    );
    return recentAttempts.length >= this.MAX_ATTEMPTS;
  }

  getRemainingLockoutTime(email: string): number {
    const attempts = this.failedAttempts.get(email) || [];
    if (attempts.length === 0) return 0;

    const latestAttempt = attempts[attempts.length - 1];
    const elapsed = Date.now() - latestAttempt.timestamp.getTime();
    const remaining = this.LOCKOUT_DURATION - elapsed;
    return Math.max(0, remaining);
  }
}
