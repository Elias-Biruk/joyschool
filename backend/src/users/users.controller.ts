import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/v1/users')
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

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
