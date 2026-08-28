const fs = require('fs');
const file = '../frontend/src/pages/teacher/ExamCreation.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  `      if (response.ok) {
        toast.success(status === 'draft' ? 'Exam saved as draft' : 'Exam submitted to admin for review!');
      } else {
        toast.error('Failed to save examination to the server.');
      }`,
  `      if (response.ok) {
        toast.success(status === 'draft' ? 'Exam saved as draft' : 'Exam submitted to admin for review!');
      } else {
        const errorData = await response.json().catch(() => null);
        console.error('Server error response:', errorData);
        toast.error(errorData?.message || 'Failed to save examination to the server.');
      }`
);

fs.writeFileSync(file, code);
