export const sampleTree = [
  {
    id: 'root-classes',
    name: 'My Classes',
    type: 'folder',
    children: [
      {
        id: 'class-math',
        name: 'Mathematics',
        type: 'folder',
        children: [
          { id: 'math-syllabus.pdf', name: 'Syllabus.pdf', type: 'file', size: '520 KB', modified: 'Aug 1, 2026' },
          { id: 'math-notes.docx', name: 'Notes.docx', type: 'file', size: '1.2 MB', modified: 'Aug 6, 2026' },
        ],
      },
      {
        id: 'class-science',
        name: 'Science',
        type: 'folder',
        children: [
          { id: 'science-lecture.mp4', name: 'Lecture.mp4', type: 'file', size: '32 MB', modified: 'Aug 7, 2026' },
          { id: 'science-lab.pdf', name: 'Lab Guide.pdf', type: 'file', size: '760 KB', modified: 'Aug 2, 2026' },
        ],
      },
      {
        id: 'class-history',
        name: 'History',
        type: 'folder',
        children: [
          { id: 'history-timeline.png', name: 'Timeline.png', type: 'file', size: '2.5 MB', modified: 'Jul 30, 2026' },
          { id: 'history-essay.docx', name: 'Essay.docx', type: 'file', size: '1.0 MB', modified: 'Aug 4, 2026' },
        ],
      },
    ],
  },
  {
    id: 'root-assignments',
    name: 'Assignments',
    type: 'folder',
    children: [
      {
        id: 'assignment-due-today',
        name: 'Due Today',
        type: 'folder',
        children: [
          { id: 'assignment-math-worksheet.pdf', name: 'Math Worksheet.pdf', type: 'file', size: '450 KB', modified: 'Aug 8, 2026' },
          { id: 'assignment-english.docx', name: 'English Draft.docx', type: 'file', size: '880 KB', modified: 'Aug 8, 2026' },
        ],
      },
      {
        id: 'assignment-upcoming',
        name: 'Upcoming',
        type: 'folder',
        children: [
          { id: 'assignment-science-report.docx', name: 'Science Report.docx', type: 'file', size: '1.1 MB', modified: 'Aug 10, 2026' },
          { id: 'assignment-geography.pptx', name: 'Geography Slides.pptx', type: 'file', size: '2.9 MB', modified: 'Aug 12, 2026' },
        ],
      },
    ],
  },
  {
    id: 'root-resources',
    name: 'Resources',
    type: 'folder',
    children: [
      {
        id: 'resources-notes',
        name: 'Class Notes',
        type: 'folder',
        children: [
          { id: 'notes-math.pdf', name: 'Math Notes.pdf', type: 'file', size: '680 KB', modified: 'Aug 5, 2026' },
          { id: 'notes-chemistry.pdf', name: 'Chemistry Notes.pdf', type: 'file', size: '730 KB', modified: 'Aug 3, 2026' },
        ],
      },
      {
        id: 'resources-handouts',
        name: 'Handouts',
        type: 'folder',
        children: [
          { id: 'handout-study-guide.pdf', name: 'Study Guide.pdf', type: 'file', size: '1.5 MB', modified: 'Aug 2, 2026' },
          { id: 'handout-calendar.xlsx', name: 'Calendar.xlsx', type: 'file', size: '210 KB', modified: 'Jul 28, 2026' },
        ],
      },
    ],
  },
];
