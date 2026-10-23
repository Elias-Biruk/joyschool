import { Controller, Get, Put, Body, Param, UseGuards, Request, Post } from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CompleteOnboardingDto } from './dto/onboarding.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: RequestWithUser) {
    return this.usersService.findById(req.user.userId);
  }

  @Put('profile')
  async updateProfile(@Request() req: RequestWithUser, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Post('onboarding')
  async completeOnboarding(@Request() req: RequestWithUser, @Body() onboardingDto: CompleteOnboardingDto) {
    const user = await this.usersService.completeOnboardingProfile(req.user.userId, onboardingDto);
    return user;
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
