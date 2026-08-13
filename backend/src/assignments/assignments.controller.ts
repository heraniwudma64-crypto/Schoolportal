import { Controller, Post, Get, Body } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('publish')
  publish(@Body() dto: CreateAssignmentDto) {
    return this.assignmentsService.publishAssignment(dto);
  }

  @Get('recent')
  getRecent() {
    return this.assignmentsService.getRecentPublications();
  }
}