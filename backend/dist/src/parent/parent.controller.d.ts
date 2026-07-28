import { ParentService } from './parent.service';
export declare class ParentController {
    private readonly parentService;
    constructor(parentService: ParentService);
    getMyChildData(req: any, studentUserId: string): Promise<{
        id: string;
        loginId: string;
        password: string;
        name: string;
        role: import("@prisma/client").$Enums.Role;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
}
