import React, { ReactNode, useEffect, useState } from 'react';
import {
  FaThLarge,
  FaCalendarAlt,
  FaCheckSquare,
  FaClipboardList,
  FaGraduationCap,
  FaFileAlt,
  FaBook,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
} from 'react-icons/fa';

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [profile, setProfile] = useState<{ name: string; role: string; profilePic?: string }>({
    name: 'Student',
    role: 'Student',
    profilePic: '',
  });
  const [activeTab, setActiveTab] = useState('Dashboard');

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
    { name: 'Dashboard', icon: <FaThLarge /> },
    { name: 'My Classes', icon: <FaCalendarAlt /> },
    { name: 'Attendance', icon: <FaCheckSquare /> },
    { name: 'Assignments', icon: <FaClipboardList /> },
    { name: 'Grades', icon: <FaGraduationCap /> },
    { name: 'Exam Schedule', icon: <FaFileAlt /> },
    { name: 'Materials', icon: <FaBook /> },
    { name: 'Performance', icon: <FaChartBar /> },
    { name: 'Settings', icon: <FaCog /> },
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
              <FaGraduationCap />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Student Portal</h3>
              <span style={{ fontSize: '12px', color: '#9ba4b5' }}>Learning Dashboard</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {menuItems.map((item) => {
              const isActive = item.name === activeTab;
              return (
                <div
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
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
              <FaUserCircle style={{ fontSize: '40px', color: '#9ba4b5' }} />
            )}
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ margin: 0, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.name}</h4>
              <span style={{ fontSize: '12px', color: '#9ba4b5' }}>{profile.role}</span>
            </div>
          </div>
          <div onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ff6b6b', cursor: 'pointer', padding: '8px 0' }}>
            <FaSignOutAlt />
            <span>Log Out</span>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: '70px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '8px 15px', borderRadius: '8px', width: '300px', gap: '10px' }}>
            <span>🔍</span>
            <input type="text" placeholder="Search for something..." style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <span style={{ cursor: 'pointer', fontSize: '18px' }}>🔔</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {profile.profilePic ? (
                <img src={profile.profilePic} alt="Profile" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <FaUserCircle style={{ fontSize: '35px', color: '#64748b' }} />
              )}
              <div>
                <span style={{ fontWeight: 'bold', fontSize: '14px', display: 'block' }}>{profile.name}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{profile.role}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>{children}</div>
      </main>
    </div>
  );
}
