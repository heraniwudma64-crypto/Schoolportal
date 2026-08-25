import { Controller, Post, Body, Req } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  async createAssignment(@Body() body: any, @Req() req: any) {
    // Check various common properties where user/teacher ID might be stored
    const userId = req.user?.sub || req.user?.id || body.userId || body.teacherId;
    
    return this.assignmentsService.create(body, userId);
  }
}