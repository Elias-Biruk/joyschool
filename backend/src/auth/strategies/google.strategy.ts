import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const clientId = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL = configService.get<string>('GOOGLE_CALLBACK_URL');

    // Only initialize Google Strategy if credentials are configured
    if (clientId && clientSecret && callbackURL) {
      super({
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
        scope: ['email', 'profile'],
      });
      this.logger.log('Google OAuth strategy initialized');
    } else {
      // @ts-ignore - Prevent initialization without credentials
      super({
        clientID: 'placeholder',
        clientSecret: 'placeholder',
        callbackURL: 'placeholder',
        scope: ['email', 'profile'],
      });
      this.logger.warn('Google OAuth credentials not configured. Google sign-in will be disabled.');
    }
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, name, picture } = profile;

    if (!emails || emails.length === 0) {
      return done(new UnauthorizedException('No email in Google profile'), undefined);
    }

    const email = emails[0].value;
    const emailVerified = emails[0].verified || false;

    const user = {
      provider: 'google',
      providerId: id,
      email,
      emailVerified,
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      avatar: picture,
    };

    done(null, user);
  }
}
