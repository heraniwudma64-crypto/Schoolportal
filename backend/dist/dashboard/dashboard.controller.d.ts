import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getDashboard(studentId?: string): Promise<{
        totalSubjects: number;
        pendingAssignments: number;
        attendance: number;
        average: number;
        announcements: {
            id: any;
            title: any;
            description: any;
            date: any;
        }[];
        deadlines: {
            id: any;
            title: any;
            courseName: any;
            dueDate: any;
            status: any;
        }[];
    }>;
    getDashboardById(studentId: string): Promise<{
        totalSubjects: number;
        pendingAssignments: number;
        attendance: number;
        average: number;
        announcements: {
            id: any;
            title: any;
            description: any;
            date: any;
        }[];
        deadlines: {
            id: any;
            title: any;
            courseName: any;
            dueDate: any;
            status: any;
        }[];
    }>;
}
