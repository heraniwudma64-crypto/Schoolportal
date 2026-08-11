import { AttendanceService } from './attendance.service';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    markAttendance(body: {
        userId: string;
        courseId: string;
        status: AttendanceStatus;
        date?: string;
    }): Promise<any>;
    getCourseAttendance(courseId: string): Promise<any>;
}
