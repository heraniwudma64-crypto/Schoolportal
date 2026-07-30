"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const enrollments_controller_1 = require("./enrollments.controller");
describe('EnrollmentsController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [enrollments_controller_1.EnrollmentsController],
        }).compile();
        controller = module.get(enrollments_controller_1.EnrollmentsController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=enrollments.controller.spec.js.map