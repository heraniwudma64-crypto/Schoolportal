import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { StudentsService } from './students.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

interface RequestWithUser {
  user: {
    id: string;
    userId?: string;
    role: string;
  };
}

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles('STUDENT', 'ADMIN')
  @Get('profile')
  async getStudentProfile(@Req() req: RequestWithUser) {
    const userId = req.user.userId || req.user.id;
    return this.studentsService.getStudentProfile(userId);
  }
}
