import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
export declare class AssignmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    publishAssignment(dto: CreateAssignmentDto): Promise<{
        message: string;
        data: any;
    }>;
    getRecentPublications(): Promise<any>;
}
