import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { CreateParentDto } from './dto/create-parent.dto';
import { CreateAcademicYearDto } from './dto/create-academic-year.dto';
import { CreateSubjectDto } from './dto/create-subject.dto';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('register/student')
  async registerStudent(@Body() dto: CreateStudentDto) {
    return this.adminService.registerStudent(dto);
  }

  @Post('register/teacher')
  async registerTeacher(@Body() dto: CreateTeacherDto) {
    return this.adminService.registerTeacher(dto);
  }

  @Post('register/parent')
  async registerParent(@Body() dto: CreateParentDto) {
    return this.adminService.registerParent(dto);
  }

  @Get('users')
  async getAllUsers(@Query('role') role?: Role) {
    return this.adminService.getAllUsers(role);
  }

  @Patch('users/:id/status')
  async toggleUserStatus(
    @Param('id') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.adminService.toggleUserStatus(userId, isActive);
  }

  @Post('academic-year')
  async createAcademicYear(@Body() dto: CreateAcademicYearDto) {
    return this.adminService.createAcademicYear(dto);
  }

  @Post('subject')
  async createSubject(@Body() dto: CreateSubjectDto) {
    return this.adminService.createSubject(dto);
  }
}
