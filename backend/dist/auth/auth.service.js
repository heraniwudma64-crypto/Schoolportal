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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateUser(loginId, pass) {
        const user = await this.prisma.user.findUnique({
            where: { email: loginId },
        });
        if (user && (await bcrypt.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(loginId, pass) {
        const user = await this.validateUser(loginId, pass);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        return {
            message: 'Login successful',
            user,
        };
    }
    async register(dto) {
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const nameParts = (dto.fullName || '').trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        return await this.prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    loginId: dto.idNumber,
                    email: dto.email || null,
                    password: hashedPassword,
                    role: dto.role,
                },
            });
            if (dto.role === 'STUDENT') {
                await prisma.student.create({
                    data: {
                        userId: user.id,
                        admissionNo: dto.idNumber,
                        firstName,
                        lastName,
                        classGrade: dto.classGrade || null,
                        address: dto.address || null,
                        parentName: dto.parentName || null,
                        parentPhone: dto.parentPhone || null,
                        medicalStatus: dto.medicalStatus || null,
                    },
                });
            }
            else if (dto.role === 'TEACHER' || dto.role === 'ADMIN') {
                await prisma.teacher.create({
                    data: {
                        userId: user.id,
                        firstName,
                        lastName,
                        address: dto.address || null,
                        medicalStatus: dto.medicalStatus || null,
                    },
                });
            }
            return { message: 'User registered successfully', userId: user.id };
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map