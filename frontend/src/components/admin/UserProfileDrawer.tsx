import React from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  BookOpen,
  Building2,
  Users,
  GraduationCap,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import { ManagedUser, ROLE_COLORS, ROLE_LABELS, getUserDisplayName, getUserProfileId } from '../../types/users';
import { cn } from '../../lib/utils';

interface UserProfileDrawerProps {
  user: ManagedUser | null;
  onClose: () => void;
  onManageChildren?: (user: ManagedUser) => void;
}

const Field: React.FC<{ icon: React.ElementType; label: string; value?: string | null }> = ({
  icon: Icon,
  label,
  value,
}) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  );
};

const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({ user, onClose, onManageChildren }) => {
  if (!user) return null;

  const roleColor = ROLE_COLORS[user.role];
  const displayName = getUserDisplayName(user);
  const profileId = getUserProfileId(user);
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md h-[calc(100vh-2rem)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">User Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar + name + status */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 rounded-2xl bg-blue-900/10 flex items-center justify-center mx-auto text-2xl font-black text-blue-900">
              {initials}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">{displayName}</h3>
              <p className="text-sm text-gray-500">{user.email ?? 'No email'}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', roleColor.bg, roleColor.text)}>
                {ROLE_LABELS[user.role]}
              </span>
              <span className={cn('px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest', user.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Account info */}
          <section className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Account</h4>
            <div className="space-y-3">
              <Field icon={Shield} label="Login ID" value={user.loginId} />
              <Field icon={Shield} label="Profile ID" value={profileId !== user.loginId ? profileId : undefined} />
              <Field icon={Mail} label="Email" value={user.email} />
              <Field icon={Phone} label="Phone" value={user.phoneNumber} />
              <Field icon={Calendar} label="Registered" value={fmt(user.createdAt)} />
              <Field icon={Clock} label="Last Login" value={fmt(user.lastLoginAt)} />
            </div>
          </section>

          {/* Student profile */}
          {user.Student && (
            <section className="space-y-3">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Student Details</h4>
              <div className="space-y-3">
                <Field icon={GraduationCap} label="Admission No." value={user.Student.admissionNo} />
                <Field icon={BookOpen} label="Class / Section" value={user.Student.ClassSection?.name} />
                <Field icon={User} label="Gender" value={user.Student.gender} />
                <Field icon={Calendar} label="Date of Birth" value={fmt(user.Student.dob)} />
                <Field icon={MapPin} label="Address" value={user.Student.address} />
                <Field icon={AlertCircle} label="Emergency Contact" value={user.Student.emergencyContact} />
                <Field icon={Shield} label="Enrollment Status" value={user.Student.status} />
              </div>
              {user.Student.Parent && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent / Guardian</p>
                  <p className="text-sm font-black text-gray-900">{user.Student.Parent.firstName} {user.Student.Parent.lastName}</p>
                  {user.Student.Parent.phoneNumber && <p className="text-xs text-gray-500">{user.Student.Parent.phoneNumber}</p>}
                  {user.Student.Parent.relationship && <p className="text-xs text-gray-500">{user.Student.Parent.relationship}</p>}
                </div>
              )}
            </section>
          )}

          {/* Teacher profile */}
          {user.Teacher && (
            <section className="space-y-3">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Teacher Details</h4>
              <div className="space-y-3">
                <Field icon={Building2} label="Staff ID" value={user.Teacher.staffId} />
                <Field icon={GraduationCap} label="Qualification" value={user.Teacher.qualification} />
                <Field icon={Phone} label="Phone" value={user.Teacher.phoneNumber} />
                <Field icon={MapPin} label="Address" value={user.Teacher.address} />
              </div>
            </section>
          )}

          {/* Parent profile */}
          {user.Parent && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Parent Details</h4>
                {onManageChildren && (
                  <button
                    type="button"
                    onClick={() => onManageChildren(user)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Manage Children
                  </button>
                )}
              </div>
              <div className="space-y-3">
                <Field icon={Phone} label="Phone" value={user.Parent.phoneNumber} />
                <Field icon={Building2} label="Occupation" value={user.Parent.occupation} />
                <Field icon={Users} label="Relationship to Student" value={user.Parent.relationship} />
              </div>
              {user.Parent.Student && user.Parent.Student.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Linked Children ({user.Parent.Student.length})
                  </p>
                  {user.Parent.Student.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-1 border-b border-gray-100 last:border-0">
                      <p className="text-sm font-bold text-gray-900">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400 font-mono">{s.admissionNo}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 italic">No children linked yet</p>
                  {onManageChildren && (
                    <button
                      type="button"
                      onClick={() => onManageChildren(user)}
                      className="mt-2 px-3 py-1 bg-white border border-gray-200 text-xs font-bold text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      + Link Children
                    </button>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileDrawer;
