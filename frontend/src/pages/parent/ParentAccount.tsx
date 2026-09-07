import React, { useState, useEffect, useRef } from 'react';
import { Camera, Save, UserRound, Users, Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyAccount, updateMyAccount, uploadMyAvatar, removeMyAvatar } from '../../api/account';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordForm from '../../components/account/ChangePasswordForm';

export const ParentAccount: React.FC = () => {
  const { updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const photoInput = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ name: '', email: '' });

  const { data: account, isLoading, isError } = useQuery({
    queryKey: ['myAccount'],
    queryFn: getMyAccount,
  });

  useEffect(() => {
    if (account) {
      const parentName = account.Parent
        ? `${account.Parent.firstName} ${account.Parent.lastName}`.trim()
        : account.name || account.loginId;
      setProfile({
        name: parentName,
        email: account.email || '',
      });
    }
  }, [account]);

  const syncAccount = (updated: { name: string | null; loginId: string; email: string | null; avatarUrl: string | null }) => {
    queryClient.invalidateQueries({ queryKey: ['myAccount'] });
    updateProfile({
      name: updated.name || updated.loginId,
      email: updated.email || undefined,
      avatar: updated.avatarUrl || undefined,
    });
  };

  const profileMutation = useMutation({
    mutationFn: () => updateMyAccount({ name: profile.name.trim(), email: profile.email.trim() || undefined }),
    onSuccess: (updated) => {
      syncAccount(updated);
      setEditing(false);
      toast.success('Profile updated successfully.');
    },
    onError: (error: Error) => toast.error(error.message || 'Profile could not be updated.'),
  });

  const avatarMutation = useMutation({
    mutationFn: uploadMyAvatar,
    onSuccess: (updated) => {
      syncAccount(updated);
      toast.success('Profile picture updated.');
    },
    onError: (error: Error) => toast.error(error.message || 'Photo could not be uploaded.'),
  });

  const removeAvatarMutation = useMutation({
    mutationFn: removeMyAvatar,
    onSuccess: (updated) => {
      syncAccount(updated);
      toast.success('Profile picture removed.');
    },
    onError: (error: Error) => toast.error(error.message || 'Photo could not be removed.'),
  });

  const submitProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      return toast.error('Full name is required.');
    }
    profileMutation.mutate();
  };

  const selectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      return toast.error('Choose a JPG, PNG, GIF, or WEBP image.');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Profile image must be 5MB or smaller.');
    }
    avatarMutation.mutate(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading account…
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="p-8 text-center text-red-600">
        Your account information could not be loaded.
      </div>
    );
  }

  const parent = account.Parent;
  const initials = (profile.name || account.loginId)
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <Toaster position="top-right" richColors />
      <header>
        <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your profile, security, and personal details.</p>
      </header>

      {/* Profile Card */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900">
            <UserRound className="h-5 w-5 text-blue-700" />
            Profile
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-semibold text-blue-800 hover:underline"
            >
              Edit Profile
            </button>
          )}
        </div>

        <div className="p-6">
          {/* Avatar Section */}
          <div className="mb-7 flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {account.avatarUrl ? (
                <img src={account.avatarUrl} className="h-full w-full object-cover" alt="Profile" />
              ) : (
                initials
              )}
            </div>
            <div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => photoInput.current?.click()}
                  disabled={avatarMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  <Camera className="h-4 w-4" />
                  Change photo
                </button>
                {account.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => removeAvatarMutation.mutate()}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">JPG, PNG, GIF or WEBP, up to 5MB.</p>
              <input
                ref={photoInput}
                className="hidden"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={selectPhoto}
              />
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={submitProfile} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full name</label>
              <input
                disabled={!editing}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                disabled={!editing}
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="mt-1.5 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm disabled:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Login ID</label>
              <input
                readOnly
                value={account.loginId}
                className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="relative mt-1.5">
                <input
                  readOnly
                  value={parent?.phoneNumber || account.phoneNumber || 'Not provided'}
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Occupation</label>
              <div className="relative mt-1.5">
                <input
                  readOnly
                  value={parent?.occupation || 'Not provided'}
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship to Student</label>
              <div className="relative mt-1.5">
                <input
                  readOnly
                  value={parent?.relationship || 'Parent / Guardian'}
                  className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm text-gray-500"
                />
              </div>
            </div>

            {editing && (
              <div className="flex gap-3 sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={profileMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    const parentName = account.Parent
                      ? `${account.Parent.firstName} ${account.Parent.lastName}`.trim()
                      : account.name || account.loginId;
                    setProfile({ name: parentName, email: account.email || '' });
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Linked Children Card */}
      {parent?.Student && parent.Student.length > 0 && (
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-semibold text-gray-900 mb-4">
            <Users className="h-5 w-5 text-blue-700" />
            Linked Children ({parent.Student.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {parent.Student.map((child) => (
              <div key={child.id} className="p-4 bg-gray-50 border border-gray-200/60 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-900 text-sm">{child.firstName} {child.lastName}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Adm: {child.admissionNo}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Change Password Card */}
      <ChangePasswordForm />
    </div>
  );
};

export default ParentAccount;
