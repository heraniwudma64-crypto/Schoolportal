import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Uncomment your auth guard if you have one

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  // @UseGuards(JwtAuthGuard) // Protect route to get req.user
  async createAssignment(@Body() body: any, @Req() req: any) {
    // Assuming your auth guard attaches the logged-in user to req.user
    // If your teacher profile is linked to the user, find or pass the teacherId:
    const teacherId = req.user?.teacherId || body.teacherId; 

    return this.assignmentsService.create({
      ...body,
      teacherId: teacherId, 
    });
  }
}