"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const teachers_controller_1 = require("./teachers.controller");
const teachers_service_1 = require("./teachers.service");
describe('TeachersController', () => {
    let controller;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [teachers_controller_1.TeachersController],
            providers: [
                {
                    provide: teachers_service_1.TeachersService,
                    useValue: {
                        getTeacherProfile: jest.fn().mockResolvedValue({ message: 'test' }),
                    },
                },
            ],
        }).compile();
        controller = module.get(teachers_controller_1.TeachersController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=teachers.controller.spec.js.map