import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '',
      scope: ['email', 'profile'],
    });
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
