import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    markAttendance(body: {
        userId: string;
        courseId: string;
        status: any;
        date?: string;
    }): Promise<any>;
    getCourseAttendance(courseId: string): Promise<any>;
}
