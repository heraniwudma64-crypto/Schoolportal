"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const courses_controller_1 = require("./courses.controller");
describe('CoursesController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [courses_controller_1.CoursesController],
        }).compile();
        controller = module.get(courses_controller_1.CoursesController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=courses.controller.spec.js.map