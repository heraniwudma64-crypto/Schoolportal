import 'dotenv/config';
import { OnModuleInit } from '@nestjs/common';
export declare class PrismaService implements OnModuleInit {
    private client;
    constructor();
    onModuleInit(): Promise<void>;
    getClient(): any;
    get user(): any;
    get student(): any;
    get enrollment(): any;
    get attendance(): any;
    get examAttempt(): any;
    get notice(): any;
    get assignment(): any;
    count(model: string, where?: any): Promise<number>;
    findFirst(model: string, args?: any): Promise<any>;
    findMany(model: string, args?: any): Promise<any[]>;
    findUnique(model: string, args?: any): Promise<any>;
    create(model: string, args?: any): Promise<any>;
}
