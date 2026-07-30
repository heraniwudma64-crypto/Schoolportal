"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const enrollments_service_1 = require("./enrollments.service");
describe('EnrollmentsService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [enrollments_service_1.EnrollmentsService],
        }).compile();
        service = module.get(enrollments_service_1.EnrollmentsService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=enrollments.service.spec.js.map