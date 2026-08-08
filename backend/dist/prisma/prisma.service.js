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
exports.PrismaService = void 0;
require("dotenv/config");
const common_1 = require("@nestjs/common");
let PrismaService = class PrismaService {
    client;
    constructor() {
        this.client = null;
    }
    async onModuleInit() {
        try {
            const { PrismaClient } = await import('@prisma/client');
            const { PrismaPg } = await import('@prisma/adapter-pg');
            const { Pool } = await import('pg');
            const connectionString = process.env.DATABASE_URL;
            if (!connectionString) {
                this.client = new PrismaClient();
                return;
            }
            const pool = new Pool({ connectionString });
            const adapter = new PrismaPg(pool);
            this.client = new PrismaClient({ adapter });
            await this.client.$connect();
        }
        catch (error) {
            this.client = null;
        }
    }
    getClient() {
        return this.client;
    }
    get user() {
        return (this.client?.user ?? {
            findFirst: async () => null,
            findMany: async () => [],
            create: async () => null,
            count: async () => 0,
        });
    }
    get student() {
        return (this.client?.student ?? {
            findMany: async () => [],
            create: async () => null,
            findUnique: async () => null,
        });
    }
    get enrollment() {
        return (this.client?.enrollment ?? {
            count: async () => 0,
            findMany: async () => [],
        });
    }
    get attendance() {
        return (this.client?.attendance ?? {
            findMany: async () => [],
        });
    }
    get examAttempt() {
        return (this.client?.examAttempt ?? {
            findMany: async () => [],
        });
    }
    get notice() {
        return (this.client?.notice ?? {
            findMany: async () => [],
        });
    }
    get assignment() {
        return (this.client?.assignment ?? {
            findMany: async () => [],
        });
    }
    async count(model, where) {
        try {
            if (this.client && this.client[model] && typeof this.client[model].count === 'function') {
                return await this.client[model].count({ where });
            }
        }
        catch (e) {
        }
        return 0;
    }
    async findFirst(model, args) {
        try {
            if (this.client && this.client[model] && typeof this.client[model].findFirst === 'function') {
                return await this.client[model].findFirst(args);
            }
        }
        catch (e) {
        }
        return null;
    }
    async findMany(model, args) {
        try {
            if (this.client && this.client[model] && typeof this.client[model].findMany === 'function') {
                return await this.client[model].findMany(args);
            }
        }
        catch (e) {
        }
        return [];
    }
    async findUnique(model, args) {
        try {
            if (this.client && this.client[model] && typeof this.client[model].findUnique === 'function') {
                return await this.client[model].findUnique(args);
            }
        }
        catch (e) {
        }
        return null;
    }
    async create(model, args) {
        try {
            if (this.client && this.client[model] && typeof this.client[model].create === 'function') {
                return await this.client[model].create(args);
            }
        }
        catch (e) {
        }
        return null;
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map