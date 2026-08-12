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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let AuthController = class AuthController {
    constructor(authService, prisma) {
        this.authService = authService;
        this.prisma = prisma;
    }
    async register(body) {
        console.log('Incoming Register Payload:', body);
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const identifier = body.idNumber || body.loginId || body.email;
        return await this.prisma.user.create({
            data: {
                idNumber: body.idNumber || '',
                loginId: identifier,
                email: body.email || '',
                password: hashedPassword,
                role: body.role || 'TEACHER',
                fullName: body.fullName || '',
                gender: body.gender || '',
                classGrade: body.classGrade || '',
                parentName: body.parentName || '',
                parentPhone: body.parentPhone || '',
                address: body.address || '',
                medicalStatus: body.medicalStatus || '',
            },
        });
    }
    async login(body) {
        console.log('----------------- LOGIN ATTEMPT -----------------');
        console.log('Incoming Login Payload:', body);
        const allUsers = await this.prisma.user.findMany();
        console.log('DEBUG: Users currently in THIS backend database:', allUsers.map(u => u.loginId || u.idNumber));
        const identifier = body.loginId || body.email || body.username || body.idNumber;
        if (!identifier) {
            throw new common_1.UnauthorizedException('Identifier is required');
        }
        const user = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { loginId: { equals: identifier, mode: 'insensitive' } },
                    { email: { equals: identifier, mode: 'insensitive' } },
                ],
            },
        });
        if (!user) {
            console.log(`DEBUG: User '${identifier}' NOT found in this database.`);
            throw new common_1.UnauthorizedException('Invalid ID or password');
        }
        console.log('DEBUG: User successfully found! ID:', user.id);
        const isPasswordValid = await bcrypt.compare(body.password, user.password);
        if (!isPasswordValid) {
            console.log('DEBUG: Password mismatch.');
            throw new common_1.UnauthorizedException('Invalid ID or password');
        }
        console.log('DEBUG: Login successful!');
        return {
            message: 'Login successful',
            role: user.role,
            userId: user.id
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        prisma_service_1.PrismaService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map