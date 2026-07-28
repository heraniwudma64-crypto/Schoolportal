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
exports.ExamService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ExamService = class ExamService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createExam(dto) {
        return this.prisma.exam.create({
            data: {
                title: dto.title,
                courseId: dto.courseId,
                classSectionId: dto.classSectionId,
            },
        });
    }
    async recordAttempt(dto) {
        const student = await this.prisma.student.findUnique({
            where: { userId: dto.userId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student profile not found for this user');
        }
        return this.prisma.examAttempt.create({
            data: {
                score: dto.score,
                examId: Number(dto.examId),
                studentId: student.id,
            },
        });
    }
    async getStudentAttempts(userId) {
        return this.prisma.examAttempt.findMany({
            where: {
                student: {
                    userId: userId,
                },
            },
            include: {
                exam: true,
            },
        });
    }
};
exports.ExamService = ExamService;
exports.ExamService = ExamService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamService);
//# sourceMappingURL=exam.service.js.map