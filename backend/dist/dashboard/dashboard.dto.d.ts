export declare class DashboardDto {
    totalSubjects: number;
    pendingAssignments: number;
    attendance: number;
    average: number;
    announcements: Array<{
        id: string;
        title: string;
        description: string;
        date: string;
    }>;
    deadlines: Array<{
        id: string;
        title: string;
        courseName: string;
        dueDate: string;
        status: string;
    }>;
}
