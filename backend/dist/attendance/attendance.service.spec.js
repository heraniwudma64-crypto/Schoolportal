"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const attendance_service_1 = require("./attendance.service");
describe('AttendanceService', () => {
    let service;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [attendance_service_1.AttendanceService],
        }).compile();
        service = module.get(attendance_service_1.AttendanceService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=attendance.service.spec.js.map