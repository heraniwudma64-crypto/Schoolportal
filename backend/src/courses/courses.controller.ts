import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // Anyone logged in can view all courses
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll() {
    return this.coursesService.findAll();
  }

  // Only TEACHER or ADMIN can create a course
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @Post()
  createCourse(@Body() body: { title: string; description?: string }, @Req() req) {
    const teacherId = req.user.userId || req.user.id;
    return this.coursesService.createCourse(body.title, body.description ?? '', String(teacherId));
  }
}