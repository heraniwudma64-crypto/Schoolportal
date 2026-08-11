import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
@Controller('courses')
@UseGuards(JwtAuthGuard) // 1. Requires ANY user to be logged in to access routes in this controller
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  findAll() {
    // 2. Any logged-in user (Student, Teacher, Admin) can view all courses
    return this.coursesService.findAll();
  }

  @Post()
  @UseGuards(RolesGuard)     // 3. Adds role checking on top of JwtAuthGuard
  @Roles('admin', 'teacher') // 4. Restricts course creation strictly to admins and teachers
  create(@Body() createCourseDto: any) {
    return this.coursesService.create(createCourseDto);
  }
}