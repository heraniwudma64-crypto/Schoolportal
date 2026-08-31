import { Bell, Camera, Eye, EyeOff, Loader2, Lock, LogOut, Palette, Save, UserRound } from 'lucide-react';
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast, Toaster } from 'sonner';
import { getMyAccount, removeMyAvatar, updateMyAccount, updateMyPassword, uploadMyAvatar } from '../../api/account';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Preferences = { assignmentAlerts: boolean; resultAlerts: boolean; announcementAlerts: boolean; theme: 'system' | 'light' | 'dark' };
const preferenceKey = 'school_portal_student_preferences';
const defaults: Preferences = { assignmentAlerts: true, resultAlerts: true, announcementAlerts: true, theme: 'system' };

export default function MyAccount() {
  const { logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const photoInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [studentDraft, setStudentDraft] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(preferenceKey) || '{}') }; } catch { return defaults; }
  });
  const { data: account, isLoading, isError } = useQuery({ queryKey: ['myAccount'], queryFn: getMyAccount });

  useEffect(() => {
    if (account) setProfile({ name: account.name || `${account.Student?.firstName || ''} ${account.Student?.lastName || ''}`.trim(), email: account.email || '' });
    if (account?.Student) {
      const student = account.Student;
      setStudentDraft({ firstName: student.firstName, fatherName: student.fatherName || '', grandfatherName: student.grandfatherName || '', gender: student.gender || '', dob: student.dob ? student.dob.slice(0, 10) : '', nationality: student.nationality || '', hasDisability: student.hasDisability, disabilityType: student.disabilityType || '', familyKebele: student.familyKebele || '', locationType: student.locationType || '', fatherEducationLevel: student.fatherEducationLevel || '', motherEducationLevel: student.motherEducationLevel || '', economicStatus: student.economicStatus || '', guardianFullName: student.guardianFullName || '', familyHeadGender: student.familyHeadGender || '', guardianEmail: student.guardianEmail || '', guardianPhone: student.guardianPhone || '', nationalId: student.nationalId || '', residenceRegion: student.residenceRegion || '', residenceZone: student.residenceZone || '', residenceWoreda: student.residenceWoreda || '', birthRegion: student.birthRegion || '', birthZone: student.birthZone || '', birthWoreda: student.birthWoreda || '', parentStatus: student.parentStatus || '' });
    }
  }, [account]);
  useEffect(() => { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); }, [preferences]);

  const syncAccount = (updated: { name: string | null; loginId: string; email: string | null; avatarUrl: string | null }) => {
    queryClient.invalidateQueries({ queryKey: ['myAccount'] });
    updateProfile({ name: updated.name || updated.loginId, email: updated.email || undefined, avatar: updated.avatarUrl || undefined });
  };
  const profileMutation = useMutation({
    mutationFn: () => updateMyAccount({ name: profile.name.trim(), email: profile.email.trim() || undefined }),
    onSuccess: updated => { syncAccount(updated); setEditing(false); toast.success('Profile updated successfully.'); },
    onError: (error: Error) => toast.error(error.message || 'Profile could not be updated.'),
  });
  const studentMutation = useMutation({
    mutationFn: () => updateMyAccount({ student: { ...studentDraft, disabilityType: studentDraft.hasDisability ? studentDraft.disabilityType || undefined : null } }),
    onSuccess: updated => { syncAccount(updated); setEditingStudent(false); toast.success('Student information updated successfully.'); },
    onError: (error: Error) => toast.error(error.message || 'Student information could not be updated.'),
  });
  const avatarMutation = useMutation({
    mutationFn: uploadMyAvatar,
    onSuccess: updated => { syncAccount(updated); toast.success('Profile picture updated.'); },
    onError: (error: Error) => toast.error(error.message || 'Photo could not be uploaded.'),
  });
  const removeAvatarMutation = useMutation({
    mutationFn: removeMyAvatar,
    onSuccess: updated => { syncAccount(updated); toast.success('Profile picture removed.'); },
    onError: (error: Error) => toast.error(error.message || 'Photo could not be removed.'),
  });
  const passwordMutation = useMutation({
    mutationFn: () => updateMyPassword({ currentPassword: password.currentPassword, newPassword: password.newPassword }),
    onSuccess: () => { setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' }); toast.success('Password changed successfully.'); },
    onError: (error: Error) => toast.error(error.message || 'Password could not be changed.'),
  });

  const submitProfile = (event: FormEvent) => { event.preventDefault(); if (!profile.name.trim()) return toast.error('Full name is required.'); profileMutation.mutate(); };
  const submitPassword = (event: FormEvent) => { event.preventDefault(); if (password.newPassword.length < 6) return toast.error('New password must be at least 6 characters.'); if (password.newPassword !== password.confirmPassword) return toast.error('New passwords do not match.'); passwordMutation.mutate(); };
  const submitStudent = (event: FormEvent) => { event.preventDefault(); if (studentDraft.hasDisability && !studentDraft.disabilityType?.trim()) return toast.error('Disability type is required when disability is Yes.'); if (studentDraft.guardianPhone && !/^[+0-9()\-\s]{7,25}$/.test(studentDraft.guardianPhone)) return toast.error('Enter a valid guardian phone number.'); studentMutation.mutate(); };
  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) return toast.error('Choose a JPG, PNG, GIF, or WEBP image.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Profile image must be 5MB or smaller.');
    avatarMutation.mutate(file);
    event.target.value = '';
  };
  const toggle = (key: keyof Omit<Preferences, 'theme'>) => setPreferences(current => ({ ...current, [key]: !current[key] }));

  if (isLoading) return <div className="flex min-h-64 items-center justify-center text-gray-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading account…</div>;
  if (isError || !account) return <div className="p-8 text-center text-red-600">Your account information could not be loaded.</div>;

  const initials = (account.name || account.loginId).split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  const passwordField = (key: keyof typeof password, label: string) => <label className="block text-sm font-medium text-gray-700">{label}<span className="relative mt-1.5 block"><input required minLength={key === 'currentPassword' ? undefined : 6} type={showPasswords ? 'text' : 'password'} value={password[key]} onChange={event => setPassword({ ...password, [key]: event.target.value })} className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-10" /><button type="button" onClick={() => setShowPasswords(value => !value)} className="absolute inset-y-0 right-2 text-gray-400">{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></span></label>;
  const studentField = (key: string, label: string, type = 'text') => <label className="block text-sm font-medium text-gray-700">{label}<input disabled={!editingStudent} type={type} value={studentDraft[key] || ''} onChange={event => setStudentDraft({ ...studentDraft, [key]: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 disabled:text-gray-600" /></label>;
  const studentSection = (title: string, children: React.ReactNode) => <section className="rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-6 py-4"><h2 className="font-semibold text-gray-900">{title}</h2>{!editingStudent && <button type="button" onClick={() => setEditingStudent(true)} className="text-sm font-semibold text-blue-800 hover:underline">Edit information</button>}</div><div className="grid gap-4 p-6 sm:grid-cols-2">{children}</div></section>;

  return <div className="mx-auto max-w-5xl space-y-6 pb-8"><Toaster position="top-right" richColors />
    <header><h1 className="text-2xl font-bold text-gray-900">My Account</h1><p className="mt-1 text-sm text-gray-500">Manage your profile, security, and student preferences.</p></header>
    <div className="grid gap-6 lg:grid-cols-3"><div className="space-y-6 lg:col-span-2">
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-6 py-4"><h2 className="flex items-center gap-2 font-semibold text-gray-900"><UserRound className="h-5 w-5 text-blue-700" />Profile</h2>{!editing && <button onClick={() => setEditing(true)} className="text-sm font-semibold text-blue-800 hover:underline">Edit Profile</button>}</div><div className="p-6"><div className="mb-7 flex items-center gap-5"><div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-700">{account.avatarUrl ? <img src={account.avatarUrl} className="h-full w-full object-cover" alt="Profile" /> : initials}</div><div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => photoInput.current?.click()} disabled={avatarMutation.isPending} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"><Camera className="h-4 w-4" />Change photo</button>{account.avatarUrl && <button type="button" onClick={() => removeAvatarMutation.mutate()} className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">Remove</button>}</div><p className="mt-2 text-xs text-gray-500">JPG, PNG, GIF or WEBP, up to 5MB.</p><input ref={photoInput} className="hidden" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={selectPhoto} /></div></div>
        <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-gray-700">Full name<input disabled={!editing} value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 disabled:text-gray-600" /></label><label className="text-sm font-medium text-gray-700">Email<input disabled={!editing} type="email" value={profile.email} onChange={event => setProfile({ ...profile, email: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 disabled:text-gray-600" /></label><label className="text-sm font-medium text-gray-700">Student ID<input readOnly value={account.Student?.admissionNo || account.loginId} className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500" /></label><label className="text-sm font-medium text-gray-700">Class<input readOnly value={account.Student?.ClassSection?.name || 'Not assigned'} className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-500" /></label>{editing && <div className="flex gap-3 sm:col-span-2"><button disabled={profileMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" />Save Changes</button><button type="button" onClick={() => { setEditing(false); setProfile({ name: account.name || '', email: account.email || '' }); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold">Cancel</button></div>}</form></div></section>
      {account.Student && <form onSubmit={submitStudent} className="space-y-6"><section className="rounded-2xl border border-blue-100 bg-blue-50 p-5"><p className="font-semibold text-blue-950">Official academic information</p><div className="mt-3 grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-gray-500">Institution ID:</span> {account.Student.institutionId || '—'}</p><p><span className="text-gray-500">Institution:</span> {account.Student.institutionName || '—'}</p><p><span className="text-gray-500">Student ID:</span> {account.Student.admissionNo}</p><p><span className="text-gray-500">Admission type:</span> {account.Student.admissionType || '—'}</p></div><p className="mt-3 text-xs text-gray-500">These official records are read-only. Contact your institution to request a correction.</p></section>{studentSection('Personal Information', <>{studentField('firstName', 'First Name')}{studentField('fatherName', "Father's Name")}{studentField('grandfatherName', "Grandfather's Name")}<label className="block text-sm font-medium text-gray-700">Sex<select disabled={!editingStudent} value={studentDraft.gender || ''} onChange={event => setStudentDraft({ ...studentDraft, gender: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><option value="">Select sex</option><option>Male</option><option>Female</option></select></label>{studentField('dob', 'Date of Birth', 'date')}{studentField('nationality', 'Nationality')}</>)}{studentSection('Family / Guardian', <>{studentField('guardianFullName', "Parent's or Guardian's Full Name")}{studentField('guardianEmail', "Parent's or Guardian's Email", 'email')}{studentField('guardianPhone', "Parent's or Guardian's Phone", 'tel')}{studentField('parentStatus', 'Parent Status')}{studentField('fatherEducationLevel', "Father's or Male Guardian's Education Level")}{studentField('motherEducationLevel', "Mother's or Female Guardian's Education Level")}{studentField('economicStatus', 'Student Economic Status')}<label className="block text-sm font-medium text-gray-700">Family Head's Gender<select disabled={!editingStudent} value={studentDraft.familyHeadGender || ''} onChange={event => setStudentDraft({ ...studentDraft, familyHeadGender: event.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><option value="">Select gender</option><option>Male</option><option>Female</option></select></label></>)}{studentSection('Residence', <>{studentField('familyKebele', 'Family Kebele')}{studentField('locationType', 'Location Type')}{studentField('residenceRegion', 'Region')}{studentField('residenceZone', 'Zone')}{studentField('residenceWoreda', 'Woreda')}</>)}{studentSection('Birth Information', <>{studentField('birthRegion', 'Region of Birth')}{studentField('birthZone', 'Zone of Birth')}{studentField('birthWoreda', 'Woreda of Birth')}</>)}{studentSection('Identification', <>{studentField('nationalId', 'National ID')}<label className="block text-sm font-medium text-gray-700">Disability<select disabled={!editingStudent} value={studentDraft.hasDisability ? 'yes' : 'no'} onChange={event => setStudentDraft({ ...studentDraft, hasDisability: event.target.value === 'yes', disabilityType: event.target.value === 'yes' ? studentDraft.disabilityType : '' })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><option value="no">No</option><option value="yes">Yes</option></select></label>{studentField('disabilityType', 'Disability Type')}</>) }{editingStudent && <div className="flex gap-3"><button disabled={studentMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white"><Save className="h-4 w-4" />Save student information</button><button type="button" onClick={() => { setEditingStudent(false); setStudentDraft({}); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold">Cancel</button></div>}</form>}
      <section className="rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 px-6 py-4"><h2 className="flex items-center gap-2 font-semibold text-gray-900"><Lock className="h-5 w-5 text-blue-700" />Security</h2></div><form onSubmit={submitPassword} className="space-y-4 p-6">{passwordField('currentPassword', 'Current password')}{passwordField('newPassword', 'New password')}{passwordField('confirmPassword', 'Confirm new password')}<button disabled={passwordMutation.isPending} className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white">{passwordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Change Password</button></form></section>
    </div><aside className="space-y-6"><section className="rounded-2xl border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 px-5 py-4"><h2 className="flex items-center gap-2 font-semibold text-gray-900"><Bell className="h-5 w-5 text-blue-700" />Notifications</h2></div>{([['assignmentAlerts', 'New assignment alerts'], ['resultAlerts', 'Result announcements'], ['announcementAlerts', 'School announcements']] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center justify-between border-b border-gray-50 px-5 py-3 text-sm"><span>{label}</span><input type="checkbox" checked={preferences[key]} onChange={() => toggle(key)} className="h-4 w-4 accent-blue-900" /></label>)}</section><section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-semibold text-gray-900"><Palette className="h-5 w-5 text-blue-700" />Preferences</h2><label className="mt-4 block text-sm text-gray-700">Theme<select value={preferences.theme} onChange={event => setPreferences({ ...preferences, theme: event.target.value as Preferences['theme'] })} className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"><option value="system">System default</option><option value="light">Light</option><option value="dark">Dark</option></select></label><p className="mt-3 text-xs text-gray-500">Preferences are saved on this device.</p></section><section className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm"><h2 className="font-semibold text-gray-900">Account actions</h2><button onClick={() => { logout(); navigate('/login'); }} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut className="h-4 w-4" />Sign out</button></section></aside></div>
  </div>;
}
