import React, { ReactNode, useEffect, useState } from 'react';

interface StudentLayoutProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function StudentLayout({ children, currentPath, onNavigate }: StudentLayoutProps) {
  const [profile, setProfile] = useState<{ name: string; role: string; profilePic?: string }>({
    name: 'Abebe Kebede',
    role: 'Student',
    profilePic: '',
  });

  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    const token = localStorage.getItem('token');
    let userRole = 'Student';

    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(window.atob(base64));
        userRole = decoded.role || 'Student';

        if (!savedName) {
          const tokenName = decoded.fullName || decoded.name || decoded.username;
          if (tokenName) {
            localStorage.setItem('userName', tokenName);
          }
        }
      } catch (e) {
        console.error('Token parse failed', e);
      }
    }

    setProfile({
      name: savedName || localStorage.getItem('userName') || 'Student',
      role: userRole,
      profilePic: '',
    });
  }, []);

  const menuItems = [
    { name: 'Dashboard', icon: '🏠', path: '/student' },
    { name: 'Registered Subjects', icon: '📖', path: '/student/registered-subjects' },
    { name: 'Attendance', icon: '✅', path: '/student/attendance' },
    { name: 'Assignments', icon: '📝', path: '/student/assignments' },
    { name: 'Grades', icon: '🎓', path: '/student/grades' },
    { name: 'Exam Schedule', icon: '📄', path: '/student/exams' },
    { name: 'Materials', icon: '📚', path: '/student/materials' },
    { name: 'Performance', icon: '📈', path: '/student/performance' },
    { name: 'Settings', icon: '⚙️', path: '/student/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '260px', background: '#0B2545', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px 0', flexShrink: 0 }}>
        <div>
          <div style={{ padding: '0 20px 25px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ background: '#fff', padding: '10px', borderRadius: '10px', color: '#0B2545', fontSize: '20px' }}>
              <span>🎓</span>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Student Portal</h3>
              <span style={{ fontSize: '12px', color: '#9ba4b5' }}>Learning Dashboard</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {menuItems.map((item) => {
              const activePath = currentPath === '/' ? '/student' : currentPath;
              const isActive = activePath === item.path;
              return (
                <div
                  key={item.name}
                  onClick={() => onNavigate(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    background: isActive ? '#134074' : 'transparent',
                    color: isActive ? '#fff' : '#c5cee0',
                    borderLeft: isActive ? '4px solid #fff' : '4px solid transparent',
                    fontWeight: isActive ? 'bold' : 'normal',
                    transition: '0.2s',
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{item.icon}</span>
                  <span>{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '15px' }}>
            {profile.profilePic ? (
              <img src={profile.profilePic} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '40px', color: '#9ba4b5' }}>👤</span>
            )}
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</h4>
              <span style={{ fontSize: '12px', color: '#9ba4b5' }}>{profile.role}</span>
            </div>
          </div>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff6b6b', cursor: 'pointer', padding: '8px 0' }}>
            <span style={{ fontSize: '18px' }}>↩️</span>
            <span>Log Out</span>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ cursor: 'pointer', fontSize: '22px' }}>☰</span>
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '8px 15px', borderRadius: '8px', width: '300px', gap: '10px' }}>
              <span>🔍</span>
              <input type="text" placeholder="Search for something..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative', cursor: 'pointer', fontSize: '18px' }}>
              🔔
              <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
            </div>
            {profile.profilePic ? (
              <img src={profile.profilePic} alt="Profile" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '35px', color: '#64748b' }}>👤</span>
            )}
            <div>
              <span style={{ fontWeight: 'bold', fontSize: '14px', display: 'block' }}>{profile.name}</span>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{profile.role}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
