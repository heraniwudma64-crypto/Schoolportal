import { AssignmentService } from './assignment.service';
export declare class AssignmentController {
    private readonly assignmentService;
    constructor(assignmentService: AssignmentService);
    createAssignment(body: {
        title: string;
        description?: string;
        dueDate?: string;
        courseId: string;
    }): import("@prisma/client").Prisma.Prisma__AssignmentClient<{
        id: string;
        courseId: string;
        title: string;
        dueDate: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    submitAssignment(req: any, body: {
        content: string;
        assignmentId: string;
    }): import("@prisma/client").Prisma.Prisma__SubmissionClient<{
        id: string;
        studentId: string;
        assignmentId: string;
        submittedAt: Date;
    }, never, import("@prisma/client/runtime/client").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getCourseAssignments(courseId: string): import("@prisma/client").Prisma.PrismaPromise<({
        submissions: {
            id: string;
            studentId: string;
            assignmentId: string;
            submittedAt: Date;
        }[];
    } & {
        id: string;
        courseId: string;
        title: string;
        dueDate: Date;
    })[]>;
}
