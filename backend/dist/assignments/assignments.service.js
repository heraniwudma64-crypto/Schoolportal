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
exports.AssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AssignmentsService = class AssignmentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async publishAssignment(dto) {
        const studentsInClass = await this.prisma.student.findMany({
            where: { class: dto.targetClass },
        });
        if (!studentsInClass || studentsInClass.length === 0) {
            throw new common_1.NotFoundException(`No students found in class '${dto.targetClass}' to distribute this assignment.`);
        }
        const result = await this.prisma.$transaction(async (prisma) => {
            const assignment = await prisma.assignment.create({
                data: {
                    title: dto.title,
                    instructions: dto.instructions,
                    subject: dto.subject,
                    targetClass: dto.targetClass,
                    dueDate: new Date(dto.dueDate),
                    attachmentUrl: dto.attachmentUrl || null,
                },
            });
            const distributionData = studentsInClass.map((student) => ({
                assignmentId: assignment.id,
                studentLoginId: student.loginId,
                status: 'PENDING',
            }));
            await prisma.studentAssignment.createMany({
                data: distributionData,
            });
            return { assignment, totalRecipients: studentsInClass.length };
        });
        return {
            message: `Assignment successfully published and sent to ${result.totalRecipients} students in ${dto.targetClass}!`,
            data: result.assignment,
        };
    }
    async getRecentPublications() {
        return this.prisma.assignment.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
    }
};
exports.AssignmentsService = AssignmentsService;
exports.AssignmentsService = AssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssignmentsService);
//# sourceMappingURL=assignments.service.js.map