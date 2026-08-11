import { useState } from 'react';

interface Grade {
  subject: string;
  teacher: string;
  term1: number;
  term2: number;
  final: number;
  status: 'Excellent' | 'Very Good';
}

const grades: Grade[] = [
  { subject: 'Mathematics', teacher: 'Meron Tadesse', term1: 92, term2: 88, final: 90, status: 'Excellent' },
  { subject: 'Physics', teacher: 'Meron Tadesse', term1: 89, term2: 91, final: 90, status: 'Excellent' },
  { subject: 'English', teacher: 'Dawit Gebre', term1: 87, term2: 85, final: 86, status: 'Very Good' },
  { subject: 'Chemistry', teacher: 'Hana Belay', term1: 90, term2: 92, final: 91, status: 'Excellent' },
  { subject: 'Biology', teacher: 'Tigist Alemu', term1: 88, term2: 87, final: 88, status: 'Very Good' },
  { subject: 'Computer Science', teacher: 'Samuel Negash', term1: 94, term2: 93, final: 94, status: 'Excellent' },
];

const gradeScale = [
  { grade: 'A', range: '90 - 100', result: 'Excellent', color: '#2563eb' },
  { grade: 'B', range: '80 - 89', result: 'Good', color: '#3b82f6' },
  { grade: 'C', range: '70 - 79', result: 'Average', color: '#f59e0b' },
  { grade: 'D', range: '60 - 69', result: 'Needs Improvement', color: '#f97316' },
  { grade: 'F', range: 'Below 60', result: 'Fail', color: '#ef4444' },
];

export default function Grades() {
  const [academicYear, setAcademicYear] = useState('2024/2025');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>Grades / Report Card</h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '15px' }}>Your academic performance overview</p>
        </div>

        <select
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 14px',
            background: '#fff',
            color: '#0f172a',
            fontSize: '14px',
            outline: 'none',
            minWidth: '170px',
          }}
        >
          <option value="2024/2025">Academic Year 2024/2025</option>
          <option value="2023/2024">Academic Year 2023/2024</option>
          <option value="2022/2023">Academic Year 2022/2023</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <SummaryCard title="Overall Average" value="89.4%" badge="Excellent" icon="🏆" accent="#dbeafe" />
        <SummaryCard title="Subjects" value="6" badge="Active" icon="📖" accent="#dbeafe" />
        <SummaryCard title="Class Rank" value="3 / 42" badge="Top 10%" icon="📊" accent="#f3e8ff" />
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Subject Grades</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Updated recently</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={tableHeader}>SUBJECT</th>
                <th style={tableHeader}>TEACHER</th>
                <th style={tableHeader}>TERM 1</th>
                <th style={tableHeader}>TERM 2</th>
                <th style={tableHeader}>FINAL</th>
                <th style={tableHeader}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((item) => (
                <tr key={item.subject} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={tableCellBold}>{item.subject}</td>
                  <td style={tableCell}>{item.teacher}</td>
                  <td style={tableCellCenter}>{item.term1}</td>
                  <td style={tableCellCenter}>{item.term2}</td>
                  <td style={tableCellCenter}>{item.final}</td>
                  <td style={tableCellRight}>
                    <span style={getStatusStyle(item.status)}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
        <h2 style={{ margin: '0 0 18px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>Grade Scale</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {gradeScale.map((item) => (
            <div key={item.grade} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px 16px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '999px', background: item.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700 }}>
                  {item.grade}
                </span>
                <strong style={{ color: '#0f172a' }}>{item.range}</strong>
              </div>
              <div style={{ color: '#64748b', fontSize: '14px' }}>{item.result}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, badge, icon, accent }: { title: string; value: string; badge: string; icon: string; accent: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: '16px', padding: '20px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '8px' }}>{title}</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>{value}</div>
          <div style={{ marginTop: '8px', display: 'inline-block', padding: '6px 10px', borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8', fontSize: '12px', fontWeight: 600 }}>
            {badge}
          </div>
        </div>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: Grade['status']) {
  if (status === 'Excellent') {
    return {
      display: 'inline-block',
      padding: '6px 10px',
      borderRadius: '999px',
      background: '#dcfce7',
      color: '#16a34a',
      fontSize: '12px',
      fontWeight: 700,
    } as const;
  }

  return {
    display: 'inline-block',
    padding: '6px 10px',
    borderRadius: '999px',
    background: '#dbeafe',
    color: '#2563eb',
    fontSize: '12px',
    fontWeight: 700,
  } as const;
}

const tableHeader: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 10px',
  color: '#64748b',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.04em',
};

const tableCell: React.CSSProperties = {
  padding: '14px 10px',
  color: '#334155',
  fontSize: '14px',
};

const tableCellBold: React.CSSProperties = {
  ...tableCell,
  fontWeight: 700,
  color: '#0f172a',
};

const tableCellCenter: React.CSSProperties = {
  ...tableCell,
  textAlign: 'center',
};

const tableCellRight: React.CSSProperties = {
  ...tableCell,
  textAlign: 'right',
};
