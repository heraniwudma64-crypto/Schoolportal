import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
export declare class AssignmentsController {
    private readonly assignmentsService;
    constructor(assignmentsService: AssignmentsService);
    publish(dto: CreateAssignmentDto): Promise<{
        message: string;
        data: any;
    }>;
    getRecent(): Promise<any>;
}
