const fs = require('fs');
const file = 'src/modules/examinations/examinations.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const fallbackSection = await this.prisma.classSection.findFirst();',
  `const fallbackSection = await this.prisma.classSection.findFirst();
    const fallbackSubject = await this.prisma.subject.findFirst();

    // Check if provided subject exists
    let validSubjectId = dto.subject;
    const subjectExists = await this.prisma.subject.findUnique({ where: { id: validSubjectId } });
    if (!subjectExists) {
      validSubjectId = fallbackSubject?.id;
    }`
);

code = code.replace(
  'subjectId: dto.subject,',
  'subjectId: validSubjectId,'
);

fs.writeFileSync(file, code);
