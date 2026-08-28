const fs = require('fs');
const file = 'src/modules/examinations/examinations.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "console.error('Failed to create examination:', error);",
  "require('fs').writeFileSync('/tmp/exam_error.log', error.stack || error.message);"
);

fs.writeFileSync(file, code);
