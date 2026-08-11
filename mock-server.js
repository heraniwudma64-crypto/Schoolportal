const http = require('http');
const url = require('url');

const port = process.env.MOCK_PORT || 3000;

function mockDashboard() {
  const now = Date.now();
  return {
    totalSubjects: 5,
    pendingAssignments: 2,
    attendance: 92,
    average: 88,
    announcements: [
      { id: 'ann-1', title: 'Welcome Back!', description: 'School reopens next Monday.', date: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() },
      { id: 'ann-2', title: 'Parent-Teacher Meeting', description: 'PTM scheduled for Friday.', date: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() },
    ],
    deadlines: [
      { id: 'dl-1', title: 'Math Homework', courseName: 'Mathematics', dueDate: new Date(now + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'PENDING' },
      { id: 'dl-2', title: 'Science Project', courseName: 'Science', dueDate: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'IN_PROGRESS' },
    ],
  };
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname && parsed.pathname.startsWith('/dashboard')) {
    const payload = mockDashboard();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(payload));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(port, () => {
  console.log(`Mock dashboard server listening on http://localhost:${port}`);
});
