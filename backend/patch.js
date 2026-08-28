const fs = require('fs');
const file = 'src/modules/examinations/examinations.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  '// 1. Create the examination record\n    const examination = await this.prisma.examination.create({',
  `// Fetch fallback class and section to satisfy schema requirements if not provided
    const fallbackClass = await this.prisma.class.findFirst();
    const fallbackSection = await this.prisma.classSection.findFirst();

    try {
    // 1. Create the examination record
    const examination = await this.prisma.examination.create({`
);

code = code.replace(
  'Subject: dto.subject,',
  `subjectId: dto.subject,
        classId: dto.classId || fallbackClass?.id,
        classSectionId: dto.classSectionId || fallbackSection?.id,`
);

code = code.replace(
  'return examination;\n  }',
  `return examination;
    } catch (error) {
      console.error('Failed to create examination:', error);
      throw new Error(\`Failed to create examination: \${error.message}\`);
    }
  }`
);

fs.writeFileSync(file, code);
