import { Controller, Get, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    return this.adminService.getPlatformStats();
  }

  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
    });
  }

  @Put('users/:id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateUserRoleDto,
    @Request() req: RequestWithUser,
  ) {
    return this.adminService.updateUserRole(id, updateRoleDto, req.user.userId);
  }

  @Put('users/:id/suspend')
  async suspendUser(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.adminService.suspendUser(id, req.user.userId);
  }

  @Put('users/:id/reactivate')
  async reactivateUser(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.adminService.reactivateUser(id, req.user.userId);
  }

  @Get('courses')
  async getCourses(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getCourses({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      status,
    });
  }

  @Put('courses/:id/approve')
  async approveCourse(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.adminService.approveCourse(id, req.user.userId);
  }

  @Put('courses/:id/reject')
  async rejectCourse(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.adminService.rejectCourse(id, req.user.userId);
  }

  @Put('courses/:id/unpublish')
  async unpublishCourse(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.adminService.unpublishCourse(id, req.user.userId);
  }
}
