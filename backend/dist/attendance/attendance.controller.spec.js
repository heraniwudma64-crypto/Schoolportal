"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const attendance_controller_1 = require("./attendance.controller");
describe('AttendanceController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [attendance_controller_1.AttendanceController],
        }).compile();
        controller = module.get(attendance_controller_1.AttendanceController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=attendance.controller.spec.js.map