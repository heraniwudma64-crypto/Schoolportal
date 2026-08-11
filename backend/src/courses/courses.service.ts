import { Injectable } from '@nestjs/common';

@Injectable()
export class CoursesService {
  private courses = [
    { id: 1, title: 'Mathematics 101', description: 'Introduction to Algebra and Geometry' },
    { id: 2, title: 'Physics 101', description: 'Basics of mechanics and motion' }
  ];

  findAll() {
    return this.courses;
  }

  // Add this 'create' method to fix error TS2339
  create(createCourseDto: any) {
    const newCourse = { id: Date.now(), ...createCourseDto };
    this.courses.push(newCourse);
    return newCourse;
  }
}