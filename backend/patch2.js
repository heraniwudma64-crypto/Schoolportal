const fs = require('fs');
const file = 'src/modules/examinations/examinations.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "import { Injectable, NotFoundException } from '@nestjs/common';",
  "import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';"
);

code = code.replace(
  "throw new Error(\`Failed to create examination: \${error.message}\`);",
  "throw new InternalServerErrorException(\`Failed to create examination: \${error.message}\`);"
);

fs.writeFileSync(file, code);
