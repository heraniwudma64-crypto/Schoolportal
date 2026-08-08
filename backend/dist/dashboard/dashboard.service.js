"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DashboardService = DashboardService_1 = class DashboardService {
    prisma;
    logger = new common_1.Logger(DashboardService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardData(studentId) {
        const prismaWrapper = this.prisma;
        const client = typeof prismaWrapper.getClient === 'function' ? prismaWrapper.getClient() : null;
        if (!client) {
            this.logger.log('Prisma client not available — returning mock dashboard data');
            const now = Date.now();
            return {
                totalSubjects: 5,
                pendingAssignments: 2,
                attendance: 92,
                average: 88,
                announcements: [
                    { id: 'ann-1', title: 'Welcome Back!', description: 'School reopens next Monday.', date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() },
                    { id: 'ann-2', title: 'Parent-Teacher Meeting', description: 'PTM scheduled for Friday.', date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() },
                ],
                deadlines: [
                    { id: 'dl-1', title: 'Math Homework', courseName: 'Mathematics', dueDate: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING' },
                    { id: 'dl-2', title: 'Science Project', courseName: 'Science', dueDate: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'IN_PROGRESS' },
                ],
            };
        }
        try {
            const safeQuery = async (operation, fallback) => {
                try {
                    return await operation();
                }
                catch (error) {
                    this.logger.warn(`Dashboard query failed for ${studentId}: ${error instanceof Error ? error.message : error}`);
                    return fallback;
                }
            };
            const [totalSubjects, attendanceRecords, examAttempts, announcements, deadlines] = await Promise.all([
                safeQuery(() => client.enrollment.count({ where: { studentId } }), 0),
                safeQuery(() => client.attendance.findMany({ where: { studentId } }), []),
                safeQuery(() => client.examAttempt.findMany({ where: { studentId } }), []),
                safeQuery(() => client.notice.findMany({ orderBy: { createdAt: 'desc' }, take: 4 }), []),
                safeQuery(() => client.assignment.findMany({ where: { studentId }, orderBy: { dueDate: 'asc' }, take: 4 }), []),
            ]);
            const presentCount = attendanceRecords.filter((record) => record.status === 'PRESENT').length;
            const attendance = attendanceRecords.length
                ? Math.round((presentCount / attendanceRecords.length) * 100)
                : 0;
            const average = examAttempts.length
                ? Math.round(examAttempts.reduce((sum, attempt) => sum + Number(attempt.marksObtained), 0) / examAttempts.length)
                : 0;
            const pendingAssignments = deadlines.filter((deadline) => deadline.status !== 'COMPLETED').length;
            return {
                totalSubjects: totalSubjects || 0,
                pendingAssignments,
                attendance,
                average,
                announcements: announcements.map((announcement) => ({
                    id: announcement.id,
                    title: announcement.title,
                    description: announcement.content,
                    date: announcement.createdAt?.toISOString?.() ?? new Date().toISOString(),
                })),
                deadlines: deadlines.map((deadline) => ({
                    id: deadline.id,
                    title: deadline.title,
                    courseName: deadline.courseName,
                    dueDate: deadline.dueDate?.toISOString?.() ?? new Date().toISOString(),
                    status: deadline.status,
                })),
            };
        }
        catch (error) {
            this.logger.error('Failed to build dashboard payload', error);
            return {
                totalSubjects: 0,
                pendingAssignments: 0,
                attendance: 0,
                average: 0,
                announcements: [],
                deadlines: [],
            };
        }
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = DashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map