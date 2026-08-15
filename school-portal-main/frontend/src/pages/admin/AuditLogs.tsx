import React from 'react';
import { Activity, Shield, User, Key, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const AuditLogs = () => {
  const logs = [
    { type: 'auth', user: 'Alemayehu Gebre', action: 'System Login', time: '2 mins ago', details: 'Successful login from IP 192.168.1.1' },
    { type: 'exam', user: 'Meron Tadesse', action: 'Exam Submitted', time: '15 mins ago', details: 'Physics Final submitted for review' },
    { type: 'security', user: 'Alemayehu Gebre', action: 'Password Reset', time: '1 hour ago', details: 'Password reset for student STD005' },
    { type: 'academic', user: 'Dawit Gebre', action: 'Attendance Updated', time: '2 hours ago', details: 'Attendance marked for Grade 11A English' },
    { type: 'system', user: 'System', action: 'Auto-Backup', time: '5 hours ago', details: 'Database backup completed successfully' },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'auth': return Key;
      case 'exam': return FileText;
      case 'security': return Shield;
      case 'academic': return User;
      case 'system': return CheckCircle2;
      default: return Activity;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'auth': return 'text-amber-600 bg-amber-50';
      case 'exam': return 'text-blue-600 bg-blue-50';
      case 'security': return 'text-red-600 bg-red-50';
      case 'academic': return 'text-indigo-600 bg-indigo-50';
      case 'system': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900">Audit & Activity Logs</h2>
          <p className="text-sm text-gray-500">Track all administrative and academic activities across the portal.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-6 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest text-gray-700 hover:bg-gray-50 transition-colors">
            Export Logs
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">Activity Type</th>
                <th className="px-8 py-6">User / Actor</th>
                <th className="px-8 py-6">Action Performed</th>
                <th className="px-8 py-6">Details</th>
                <th className="px-8 py-6 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log, i) => {
                const Icon = getIcon(log.type);
                return (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", getColor(log.type))}>
                        <Icon className="w-3 h-3" />
                        {log.type}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black text-gray-900">{log.user}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-600">{log.action}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-gray-400 italic">{log.details}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{log.time}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl flex items-start gap-4">
        <Shield className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
        <div>
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Security Compliance</h4>
          <p className="text-xs text-amber-800 leading-relaxed">
            Audit logs are retained for 365 days. Any suspicious activity is automatically flagged and reported to the system administrator via encrypted email alerts.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
