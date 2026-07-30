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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let EnrollmentsService = class EnrollmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async enrollStudent(studentId, courseId) {
        try {
            const existing = await this.prisma.enrollment.findUnique({
                where: {
                    studentId_courseId: { studentId, courseId },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('Student is already enrolled in this course');
            }
            return await this.prisma.enrollment.create({
                data: {
                    studentId,
                    courseId,
                },
            });
        }
        catch (error) {
            console.error('CRITICAL ENROLLMENT ERROR:', error);
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException(error.message || 'Something went wrong');
        }
    }
    async getCourseStudents(courseId) {
        try {
            return await this.prisma.enrollment.findMany({
                where: { courseId },
                include: { student: true },
            });
        }
        catch (error) {
            console.error('CRITICAL GET STUDENTS ERROR:', error);
            throw new common_1.InternalServerErrorException(error.message || 'Something went wrong');
        }
    }
};
exports.EnrollmentsService = EnrollmentsService;
exports.EnrollmentsService = EnrollmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnrollmentsService);
//# sourceMappingURL=enrollments.service.js.map