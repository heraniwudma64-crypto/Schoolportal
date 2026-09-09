import { Injectable, BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ReturnSubjectDto, GetSubjectStatusDto } from './dto/correction-request.dto';

@Injectable()
export class ResultsService {
  constructor(private readonly prisma: PrismaService) {}

  // Subject Teacher saves draft or updates marks
  private async getTeacher(userId: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
    if (!teacher) throw new UnauthorizedException('Active user is not registered as a teacher');
    return teacher;
  }

  private async assertAssignment(userId: string, classSectionId: string, subjectId: string, academicYearId: string) {
    const teacher = await this.getTeacher(userId);
    const assignment = await (this.prisma as any).sectionSubjectTeacher.findFirst({ where: { teacherId: teacher.id, classSectionId, subjectId, academicYearId } });
    if (!assignment) throw new ForbiddenException('You are not assigned to this subject and section');
  }

  private async getActiveRosterStudentIds(classSectionId: string, academicYearId: string) {
    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: { classSectionId, academicYearId, status: 'ACTIVE' },
      select: { studentId: true },
    });
    return new Set(enrollments.map((enrollment) => enrollment.studentId));
  }

  private async assertRosterNotLocked(classSectionId: string, academicYearId: string) {
    const review = await (this.prisma as any).classRosterReview.findUnique({
      where: {
        classSectionId_academicYearId: {
          classSectionId,
          academicYearId,
        },
      },
      select: { status: true },
    });

    if (!review) return;

    if (review.status === 'APPROVED') {
      throw new BadRequestException(
        'The class roster for this section and academic year has been approved by the administrator and is locked for editing.',
      );
    }

    if (review.status === 'SUBMITTED_TO_ADMIN') {
      throw new BadRequestException(
        'The class roster for this section and academic year has been submitted to the administrator and is locked for editing.',
      );
    }
  }

  async saveGradesDraft(dto: {
    classSectionId: string;
    subjectId: string;
    academicYearId: string;
    term: string;
    grades: Array<{ studentId: string; marks: number }>;
  }, userId: string) {
    await this.assertAssignment(userId, dto.classSectionId, dto.subjectId, dto.academicYearId);
    await this.assertRosterNotLocked(dto.classSectionId, dto.academicYearId);
    const enrolledIds = await this.getActiveRosterStudentIds(dto.classSectionId, dto.academicYearId);
    // The client can retain a stale row after an enrollment transfer. Save
    // active-roster grades and report ignored rows instead of rejecting class work.
    const validGrades = dto.grades.filter((grade) => enrolledIds.has(grade.studentId));
    const ignoredStudentIds = dto.grades
      .filter((grade) => !enrolledIds.has(grade.studentId))
      .map((grade) => grade.studentId);
    const submittedResultCount = await (this.prisma as any).subjectResult.count({
      where: {
        classSectionId: dto.classSectionId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        term: dto.term,
        status: 'SUBMITTED',
      },
    });
    if (submittedResultCount > 0) {
      throw new BadRequestException('Submitted results are locked. Ask the homeroom teacher to return them for correction.');
    }
    const operations = validGrades.map((g) =>
      (this.prisma as any).subjectResult.upsert({
        where: {
          studentId_subjectId_classSectionId_academicYearId_term: {
            studentId: g.studentId,
            subjectId: dto.subjectId,
            classSectionId: dto.classSectionId,
            academicYearId: dto.academicYearId,
            term: dto.term,
          },
        },
        update: { marks: g.marks, status: 'DRAFT' },
        create: {
          studentId: g.studentId,
          subjectId: dto.subjectId,
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          term: dto.term,
          marks: g.marks,
          status: 'DRAFT',
        },
      })
    );
    const results = operations.length ? await this.prisma.$transaction(operations) : [];
    return { results, savedCount: results.length, ignoredStudentIds };
  }

  async publishStudentResult(dto: { classSectionId: string; subjectId: string; academicYearId: string; term: string; studentId: string }, userId: string) {
    await this.assertAssignment(userId, dto.classSectionId, dto.subjectId, dto.academicYearId);
    await this.assertRosterNotLocked(dto.classSectionId, dto.academicYearId);
    
    const activeStudentIds = await this.getActiveRosterStudentIds(dto.classSectionId, dto.academicYearId);
    if (!activeStudentIds.has(dto.studentId)) {
      throw new BadRequestException('Student is not actively enrolled in this class section for the selected academic year');
    }

    // Verify result exists for this student with marks
    const existingResult = await (this.prisma as any).subjectResult.findUnique({
      where: {
        studentId_subjectId_classSectionId_academicYearId_term: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          term: dto.term
        }
      }
    });
    if (!existingResult) {
      throw new BadRequestException('Save this student result before publishing');
    }

    // Publish the result
    const result = await (this.prisma as any).subjectResult.update({
      where: {
        studentId_subjectId_classSectionId_academicYearId_term: {
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          term: dto.term
        }
      },
      data: { status: 'SUBMITTED' }
    });
    return { success: true, count: 1, result };
  }

  // Subject Teacher submits grades to Homeroom Teacher (Locks editing)
  async submitToHomeroom(
    dto: {
      classSectionId: string;
      subjectId: string;
      academicYearId: string;
      term: string;
      homeroomTeacherId?: string;
      // Optional inline grades array — if provided, we save the draft first so
      // the teacher never has to press "Save" before pressing "Send to Homeroom".
      grades?: Array<{ studentId: string; marks: number }>;
    },
    userId: string,
  ) {
    await this.assertAssignment(userId, dto.classSectionId, dto.subjectId, dto.academicYearId);
    await this.assertRosterNotLocked(dto.classSectionId, dto.academicYearId);

    // Verify the class section and resolve its homeroom teacher
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: dto.classSectionId },
      select: { teacherId: true },
    });
    if (!classSection) throw new BadRequestException('Class section not found');
    if (!classSection.teacherId) throw new BadRequestException('No homeroom teacher assigned to this class section');

    const activeStudentIds = await this.getActiveRosterStudentIds(dto.classSectionId, dto.academicYearId);
    const enrolledCount = activeStudentIds.size;
    if (enrolledCount === 0) throw new BadRequestException('No active students enrolled in this class section');

    // ── Auto-save any grades passed inline ───────────────────────────────────
    // This lets the frontend call submit-to-homeroom in a single round-trip
    // without requiring a prior explicit draft save.
    if (dto.grades && dto.grades.length > 0) {
      const validGrades = dto.grades.filter((g) => activeStudentIds.has(g.studentId));
      if (validGrades.length > 0) {
        // Only upsert if results are not already locked (SUBMITTED)
        const lockedCount = await (this.prisma as any).subjectResult.count({
          where: {
            classSectionId: dto.classSectionId,
            subjectId: dto.subjectId,
            academicYearId: dto.academicYearId,
            term: dto.term,
            status: 'SUBMITTED',
          },
        });
        if (lockedCount === 0) {
          const upserts = validGrades.map((g) =>
            (this.prisma as any).subjectResult.upsert({
              where: {
                studentId_subjectId_classSectionId_academicYearId_term: {
                  studentId: g.studentId,
                  subjectId: dto.subjectId,
                  classSectionId: dto.classSectionId,
                  academicYearId: dto.academicYearId,
                  term: dto.term,
                },
              },
              update: { marks: g.marks },
              create: {
                studentId: g.studentId,
                subjectId: dto.subjectId,
                classSectionId: dto.classSectionId,
                academicYearId: dto.academicYearId,
                term: dto.term,
                marks: g.marks,
                status: 'DRAFT',
              },
            }),
          );
          await this.prisma.$transaction(upserts);
        }
      }
    }

    // ── Validation: every active enrolled student must have a result row ─────
    // We count rows that exist regardless of status, so a teacher who saved a
    // draft for all students can submit even before individual rows are SUBMITTED.
    const resultCount = await (this.prisma as any).subjectResult.count({
      where: {
        classSectionId: dto.classSectionId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        term: dto.term,
        studentId: { in: [...activeStudentIds] },
      },
    });

    if (resultCount === 0) {
      throw new BadRequestException('Enter marks for at least one student before submitting to homeroom');
    }
    if (resultCount < enrolledCount) {
      const missingCount = enrolledCount - resultCount;
      throw new BadRequestException(
        `${missingCount} enrolled student${missingCount > 1 ? 's are' : ' is'} still missing marks. ` +
          `Fill in all ${enrolledCount} students or use "Save Class Results" first.`,
      );
    }

    // ── Atomically mark all results SUBMITTED and resolve pending correction requests ─────
    const updated = await (this.prisma as any).subjectResult.updateMany({
      where: {
        classSectionId: dto.classSectionId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        term: dto.term,
        studentId: { in: [...activeStudentIds] },
      },
      data: { status: 'SUBMITTED' },
    });

    await (this.prisma as any).subjectCorrectionRequest.updateMany({
      where: {
        classSectionId: dto.classSectionId,
        academicYearId: dto.academicYearId,
        subjectId: dto.subjectId,
        term: dto.term,
        status: 'PENDING',
      },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
    });

    return { success: true, count: updated.count, homeroomTeacherId: classSection.teacherId };
  }

  // Homeroom Teacher checks submission status across all subjects
  async getHomeroomSubmissionMatrix(classSectionId: string, academicYearId: string, term: string, userId: string) {
    // Homeroom teacher is stored via ClassSection.teacherId
    const teacher = await this.prisma.teacher.findFirst({ where: { userId }, select: { id: true } });
    const section = teacher
      ? await this.prisma.classSection.findFirst({
          where: { id: classSectionId, teacherId: teacher.id },
          select: {
            id: true,
            name: true,
            GradeLevel: { select: { name: true } },
            AcademicYear: { select: { year: true } },
          },
        })
      : null;
    if (!section) throw new ForbiddenException('Only the homeroom teacher can view this submission matrix');

    const [enrolledCount, assignedSubjects, allSubmittedResults, allReturnedResults, allPendingCorrections, review] = await Promise.all([
      this.prisma.studentEnrollment.count({
        where: { classSectionId, academicYearId, status: 'ACTIVE' },
      }),
      (this.prisma as any).sectionSubjectTeacher.findMany({
        where: { classSectionId, academicYearId },
        select: {
          subjectId: true,
          teacherId: true,
          Subject: { select: { name: true, code: true } },
          Teacher: { select: { firstName: true, lastName: true } },
        },
        orderBy: { Subject: { name: 'asc' } },
      }),
      (this.prisma as any).subjectResult.findMany({
        where: {
          classSectionId,
          academicYearId,
          term,
          status: 'SUBMITTED',
        },
        select: { subjectId: true, studentId: true, updatedAt: true },
      }),
      (this.prisma as any).subjectResult.findMany({
        where: {
          classSectionId,
          academicYearId,
          term,
          status: 'RETURNED_FOR_CORRECTION',
        },
        select: { subjectId: true, studentId: true },
      }),
      (this.prisma as any).subjectCorrectionRequest.findMany({
        where: {
          classSectionId,
          academicYearId,
          term,
          status: 'PENDING',
        },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma as any).classRosterReview.findUnique({
        where: {
          classSectionId_academicYearId: { classSectionId, academicYearId },
        },
        select: { status: true },
      }),
    ]);

    // Group submitted results by subjectId in memory
    const resultsBySubject = new Map<string, Array<{ studentId: string; updatedAt: Date }>>();
    for (const result of allSubmittedResults) {
      let list = resultsBySubject.get(result.subjectId);
      if (!list) {
        list = [];
        resultsBySubject.set(result.subjectId, list);
      }
      list.push(result);
    }

    const returnedBySubject = new Set(allReturnedResults.map((r: any) => r.subjectId));
    const correctionsBySubject = new Map<string, any>();
    for (const corr of allPendingCorrections) {
      if (!correctionsBySubject.has(corr.subjectId)) {
        correctionsBySubject.set(corr.subjectId, corr);
      }
    }

    const isRosterLocked = review?.status === 'APPROVED' || review?.status === 'SUBMITTED_TO_ADMIN';

    const matrix = assignedSubjects.map((assignment: any) => {
      const submittedResults = resultsBySubject.get(assignment.subjectId) || [];
      const submittedCount = new Set(submittedResults.map((result: any) => result.studentId)).size;
      const submittedAt = submittedResults.length
        ? submittedResults.reduce(
            (latest: Date, result: any) => (result.updatedAt > latest ? result.updatedAt : latest),
            submittedResults[0].updatedAt,
          )
        : null;

      const isReturned = returnedBySubject.has(assignment.subjectId);
      const pendingCorrection = correctionsBySubject.get(assignment.subjectId);
      const isCorrectionRequired = isReturned || !!pendingCorrection;
      const isSubmitted = !isCorrectionRequired && enrolledCount > 0 && submittedCount === enrolledCount;

      return {
        subjectId: assignment.subjectId,
        subjectName: assignment.Subject.name,
        subjectCode: assignment.Subject.code,
        teacherId: assignment.teacherId,
        teacherName: `${assignment.Teacher.firstName} ${assignment.Teacher.lastName}`,
        submittedCount,
        enrolledCount,
        isSubmitted,
        isReturnedForCorrection: isCorrectionRequired,
        correctionRequired: isCorrectionRequired,
        correctionReason: pendingCorrection?.reason ?? null,
        returnedAt: pendingCorrection?.createdAt ?? null,
        canReturn: isSubmitted && !isRosterLocked,
        status: isCorrectionRequired
          ? 'RETURNED_FOR_CORRECTION'
          : isSubmitted
            ? 'SUBMITTED'
            : submittedCount > 0
              ? 'DRAFT'
              : 'NOT_STARTED',
        completionPercentage: enrolledCount ? Math.round((submittedCount / enrolledCount) * 100) : 0,
        submittedAt,
      };
    });

    const allSubmitted = matrix.length > 0 && matrix.every((item: any) => item.isSubmitted);
    return {
      allSubmitted,
      subjects: matrix,
      matrix,
      totalSubmitted: matrix.filter((item: any) => item.isSubmitted).length,
      totalSubjects: matrix.length,
      isRosterLocked,
      rosterReviewStatus: review?.status ?? 'DRAFT',
      classSectionName: [section.GradeLevel?.name, section.name].filter(Boolean).join(' '),
      academicYear: section.AcademicYear?.year ?? academicYearId,
      term,
    };
  }

  // Get available homeroom teachers for a class section
  async getHomeroomTeachers(classSectionId: string, academicYearId: string) {
    // Get the class section with its current homeroom teacher
    const classSection = await this.prisma.classSection.findUnique({
      where: { id: classSectionId },
      include: {
        Teacher: {
          select: { id: true, userId: true, firstName: true, lastName: true }
        }
      }
    });

    if (!classSection) {
      throw new BadRequestException('Class section not found');
    }

    if (!classSection.Teacher) {
      throw new BadRequestException('No homeroom teacher assigned to this class section');
    }

    // A subject result must be sent to the section's actual homeroom teacher.
    // Offering subject teachers as alternate recipients caused invisible results.
    const teachers = [{
        id: classSection.Teacher.id,
        name: `${classSection.Teacher.firstName} ${classSection.Teacher.lastName}`,
        isCurrentHomeroom: true
    }];

    return {
      classSectionId,
      teachers,
      defaultHomeroomTeacherId: classSection.teacherId
    };
  }

  // Get all student results for a given class, term
  async getStudentResults(classSectionId: string, academicYearId: string, term: string, userId: string) {
    // Verify user is homeroom teacher for this section
    const teacher = await this.prisma.teacher.findFirst({ where: { userId }, select: { id: true } });
    const section = teacher
      ? await this.prisma.classSection.findFirst({
          where: { id: classSectionId, teacherId: teacher.id },
          select: { id: true },
        })
      : null;
    if (!section) throw new ForbiddenException('Only the homeroom teacher can view student results');

    // Fetch all submitted results for this section/term
    const results = await (this.prisma as any).subjectResult.findMany({
      where: {
        classSectionId,
        academicYearId,
        term,
        status: 'SUBMITTED'
      },
      include: { 
        Student: { select: { admissionNo: true, firstName: true, lastName: true } },
        Subject: true
      },
      orderBy: [{ studentId: 'asc' }, { subjectId: 'asc' }]
    });

    return results.map((result: any) => ({
      studentId: result.studentId,
      admissionNo: result.Student.admissionNo,
      studentName: `${result.Student.firstName} ${result.Student.lastName}`,
      marks: result.marks,
      subjectId: result.subjectId,
      term: result.term,
      status: result.status
    }));
  }

  // ── Step 2: Subject Grade Return & Correction ─────────────────────────────

  async returnSubjectResultToTeacher(
    dto: ReturnSubjectDto,
    userId: string,
  ) {
    const teacher = await this.getTeacher(userId);

    const section = await this.prisma.classSection.findUnique({
      where: { id: dto.classSectionId },
      select: {
        id: true,
        name: true,
        status: true,
        academicYearId: true,
        teacherId: true,
      },
    });

    if (!section) {
      throw new BadRequestException('Class section not found');
    }
    if (section.academicYearId !== dto.academicYearId) {
      throw new BadRequestException('Class section does not belong to the selected academic year');
    }
    if (section.status !== 'ACTIVE') {
      throw new BadRequestException('Class section is not active');
    }
    if (section.teacherId !== teacher.id) {
      throw new ForbiddenException('Only the assigned homeroom teacher can return a subject for correction');
    }

    const review = await (this.prisma as any).classRosterReview.findUnique({
      where: {
        classSectionId_academicYearId: {
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
        },
      },
      select: { status: true },
    });

    if (review?.status === 'APPROVED') {
      throw new BadRequestException('Cannot return subject: this roster has already been approved and is locked.');
    }
    if (review?.status === 'SUBMITTED_TO_ADMIN') {
      throw new BadRequestException('Cannot return subject: this roster has been submitted to admin and is locked.');
    }

    const submittedCount = await (this.prisma as any).subjectResult.count({
      where: {
        classSectionId: dto.classSectionId,
        academicYearId: dto.academicYearId,
        subjectId: dto.subjectId,
        term: dto.term,
        status: { in: ['SUBMITTED', 'RETURNED_FOR_CORRECTION'] },
      },
    });

    if (submittedCount === 0) {
      throw new BadRequestException('Only submitted subject results can be returned for correction');
    }

    const cleanReason = dto.reason?.trim() ? dto.reason.trim() : null;

    // Execute atomically in a transaction: update results and create/update correction request
    // ClassSection.status and ClassRosterReview.status are NEVER modified.
    return this.prisma.$transaction(async (tx) => {
      const updatedResults = await (tx as any).subjectResult.updateMany({
        where: {
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          subjectId: dto.subjectId,
          term: dto.term,
          status: 'SUBMITTED',
        },
        data: { status: 'RETURNED_FOR_CORRECTION' },
      });

      // Prevent duplicate simultaneous PENDING requests for the same section/year/subject/term
      const existingPending = await (tx as any).subjectCorrectionRequest.findFirst({
        where: {
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          subjectId: dto.subjectId,
          term: dto.term,
          status: 'PENDING',
        },
      });

      let correctionRequest;
      if (existingPending) {
        correctionRequest = await (tx as any).subjectCorrectionRequest.update({
          where: { id: existingPending.id },
          data: {
            reason: cleanReason,
            requestedById: userId,
            createdAt: new Date(),
          },
        });
      } else {
        correctionRequest = await (tx as any).subjectCorrectionRequest.create({
          data: {
            classSectionId: dto.classSectionId,
            academicYearId: dto.academicYearId,
            subjectId: dto.subjectId,
            term: dto.term,
            requestedById: userId,
            reason: cleanReason,
            status: 'PENDING',
          },
        });
      }

      return {
        success: true,
        count: updatedResults.count,
        correctionRequestId: correctionRequest.id,
        reason: cleanReason,
        status: 'RETURNED_FOR_CORRECTION',
      };
    });
  }

  async getSubjectStatus(
    dto: GetSubjectStatusDto,
    userId: string,
  ) {
    const teacher = await this.getTeacher(userId);

    const [assignment, section] = await Promise.all([
      (this.prisma as any).sectionSubjectTeacher.findFirst({
        where: {
          teacherId: teacher.id,
          classSectionId: dto.classSectionId,
          subjectId: dto.subjectId,
          academicYearId: dto.academicYearId,
        },
      }),
      this.prisma.classSection.findUnique({
        where: { id: dto.classSectionId },
        select: { id: true, teacherId: true, academicYearId: true, status: true },
      }),
    ]);

    if (!section) {
      throw new BadRequestException('Class section not found');
    }
    if (section.academicYearId !== dto.academicYearId) {
      throw new BadRequestException('Class section does not belong to the selected academic year');
    }

    const isHomeroom = section.teacherId === teacher.id;
    if (!assignment && !isHomeroom) {
      throw new ForbiddenException('You are not assigned to this subject and section');
    }

    const [enrolledCount, results, latestCorrection, review] = await Promise.all([
      this.prisma.studentEnrollment.count({
        where: { classSectionId: dto.classSectionId, academicYearId: dto.academicYearId, status: 'ACTIVE' },
      }),
      (this.prisma as any).subjectResult.findMany({
        where: {
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          subjectId: dto.subjectId,
          term: dto.term,
        },
        include: {
          Student: { select: { id: true, admissionNo: true, firstName: true, lastName: true } },
        },
        orderBy: { Student: { admissionNo: 'asc' } },
      }),
      (this.prisma as any).subjectCorrectionRequest.findFirst({
        where: {
          classSectionId: dto.classSectionId,
          academicYearId: dto.academicYearId,
          subjectId: dto.subjectId,
          term: dto.term,
        },
        orderBy: { createdAt: 'desc' },
        include: {
          requestedBy: {
            select: {
              id: true,
              name: true,
              Teacher: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
      (this.prisma as any).classRosterReview.findUnique({
        where: {
          classSectionId_academicYearId: {
            classSectionId: dto.classSectionId,
            academicYearId: dto.academicYearId,
          },
        },
        select: { status: true },
      }),
    ]);

    let subjectStatus: string = 'NOT_STARTED';
    const hasReturned = results.some((r: any) => r.status === 'RETURNED_FOR_CORRECTION');
    const allSubmitted = enrolledCount > 0 && results.length >= enrolledCount && results.every((r: any) => r.status === 'SUBMITTED');

    if (hasReturned) {
      subjectStatus = 'RETURNED_FOR_CORRECTION';
    } else if (allSubmitted) {
      subjectStatus = 'SUBMITTED';
    } else if (results.length > 0) {
      subjectStatus = 'DRAFT';
    }

    const isCorrectionPending = latestCorrection?.status === 'PENDING';
    const correctionRequired = isCorrectionPending || hasReturned;
    const isRosterLocked = review?.status === 'APPROVED' || review?.status === 'SUBMITTED_TO_ADMIN';

    const returnedByName = isCorrectionPending && latestCorrection?.requestedBy
      ? (latestCorrection.requestedBy.Teacher
          ? `${latestCorrection.requestedBy.Teacher.firstName} ${latestCorrection.requestedBy.Teacher.lastName}`.trim()
          : latestCorrection.requestedBy.name ?? null)
      : null;

    return {
      status: subjectStatus,
      isSubmitted: subjectStatus === 'SUBMITTED',
      isReturnedForCorrection: correctionRequired,
      correctionRequired,
      correctionReason: isCorrectionPending ? latestCorrection?.reason ?? null : null,
      returnedAt: isCorrectionPending ? latestCorrection?.createdAt ?? null : null,
      returnedBy: returnedByName,
      rosterReviewStatus: review?.status ?? 'DRAFT',
      rosterLocked: isRosterLocked,
      isRosterLocked,
      enrolledCount,
      resultsCount: results.length,
      grades: results.map((r: any) => ({
        studentId: r.studentId,
        admissionNo: r.Student.admissionNo,
        studentName: `${r.Student.firstName} ${r.Student.lastName}`.trim(),
        marks: r.marks,
        status: r.status,
      })),
    };
  }
}
