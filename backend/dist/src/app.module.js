"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const students_module_1 = require("./students/students.module");
const fee_module_1 = require("./fee/fee.module");
const academic_year_module_1 = require("./academic-year/academic-year.module");
const class_section_module_1 = require("./class-section/class-section.module");
const timetable_module_1 = require("./timetable/timetable.module");
const attendance_module_1 = require("./attendance/attendance.module");
const exam_module_1 = require("./exam/exam.module");
const report_card_module_1 = require("./report-card/report-card.module");
const export_module_1 = require("./export/export.module");
const notice_module_1 = require("./notice/notice.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const users_module_1 = require("./users/users.module");
const teachers_module_1 = require("./teachers/teachers.module");
const courses_module_1 = require("./courses/courses.module");
const enrollments_module_1 = require("./enrollments/enrollments.module");
const parent_service_1 = require("./parent/parent.service");
const parent_controller_1 = require("./parent/parent.controller");
const assignment_controller_1 = require("./assignment/assignment.controller");
const assignment_module_1 = require("./assignment/assignment.module");
const assignment_service_1 = require("./assignment/assignment.service");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule, students_module_1.StudentsModule, fee_module_1.FeeModule, academic_year_module_1.AcademicYearModule, class_section_module_1.ClassSectionModule, timetable_module_1.TimetableModule, attendance_module_1.AttendanceModule, exam_module_1.ExamModule, report_card_module_1.ReportCardModule, export_module_1.ExportModule, notice_module_1.NoticeModule, dashboard_module_1.DashboardModule, users_module_1.UsersModule, teachers_module_1.TeachersModule, courses_module_1.CoursesModule, enrollments_module_1.EnrollmentsModule, assignment_module_1.AssignmentModule],
        controllers: [app_controller_1.AppController, parent_controller_1.ParentController, assignment_controller_1.AssignmentController],
        providers: [assignment_service_1.AssignmentService, app_service_1.AppService, parent_service_1.ParentService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map