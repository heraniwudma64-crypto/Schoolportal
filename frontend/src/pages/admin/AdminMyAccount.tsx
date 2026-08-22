import React, { useState, useRef, useEffect } from 'react';
import { Camera, Save, Lock, User as UserIcon, ShieldCheck, Trash2, Loader2, Calendar } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toaster, toast } from 'sonner';
import { 
  getMyAccount, 
  updateMyAccount, 
  updateMyPassword, 
  uploadMyAvatar, 
  removeMyAvatar 
} from '../../api/account';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

const AdminMyAccount = () => {
  const { updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [profileForm, setProfileForm] = useState({ name: '', loginId: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  // Fetch Account Data
  const { data: account, isLoading, isError } = useQuery({
    queryKey: ['myAccount'],
    queryFn: async () => {
      const res = await getMyAccount();
      return res;
    }
  });

  useEffect(() => {
    if (account) {
      setProfileForm({
        name: account.name || '',
        loginId: account.loginId || '',
        email: account.email || '',
      });
      // Synchronize with AuthContext so Navbar updates automatically
      updateProfile({ name: account.name || account.loginId, avatar: account.avatarUrl || undefined });
    }
  }, [account]);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof profileForm) => updateMyAccount(data),
    onSuccess: (res) => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['myAccount'] });
      updateProfile({ name: res.name || res.loginId, email: res.email || undefined });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update profile');
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => uploadMyAvatar(file),
    onSuccess: (res) => {
      toast.success('Profile picture updated');
      queryClient.invalidateQueries({ queryKey: ['myAccount'] });
      updateProfile({ avatar: res.avatarUrl || undefined });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to upload picture');
    }
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => removeMyAvatar(),
    onSuccess: () => {
      toast.success('Profile picture removed');
      queryClient.invalidateQueries({ queryKey: ['myAccount'] });
      updateProfile({ avatar: undefined });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to remove picture');
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => updateMyPassword(data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to change password');
    }
  });

  // Handlers
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.loginId.trim()) {
      toast.error('Login ID is required');
      return;
    }
    updateProfileMutation.mutate(profileForm);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadAvatarMutation.mutate(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="flex-1 p-8 text-center text-red-500">
        Failed to load account information.
      </div>
    );
  }

  const initials = account.name
    ? account.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : account.loginId.substring(0, 2).toUpperCase();

  return (
    <div className="flex-1 p-8 bg-gray-50 min-h-screen">
      <Toaster position="top-right" richColors />
      
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          <p className="text-gray-500">Manage your personal information and account security.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-gray-500" />
                  Profile Information
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold border-4 border-white shadow-sm overflow-hidden flex-shrink-0">
                      {account.avatarUrl ? (
                        <img src={account.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    {uploadAvatarMutation.isPending && (
                      <div className="absolute inset-0 bg-white/60 rounded-full flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadAvatarMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        Change Photo
                      </button>
                      {account.avatarUrl && (
                        <button
                          type="button"
                          onClick={() => removeAvatarMutation.mutate()}
                          disabled={removeAvatarMutation.isPending}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 5MB.</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png, image/jpeg, image/gif, image/webp"
                      className="hidden"
                    />
                  </div>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Login ID</label>
                      <input
                        type="text"
                        value={profileForm.loginId}
                        onChange={(e) => setProfileForm({ ...profileForm, loginId: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="admin123"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                        placeholder="admin@school.com"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <input
                        type="text"
                        value={account.role}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed uppercase font-medium"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gray-500" />
                  Security
                </h2>
              </div>
              <div className="p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Account Information Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  Account Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Account Status</span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs font-medium",
                    account.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {format(new Date(account.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">Last Login</span>
                  <span className="text-sm font-medium text-gray-900">
                    {account.lastLoginAt ? format(new Date(account.lastLoginAt), 'MMM d, yyyy') : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMyAccount;
