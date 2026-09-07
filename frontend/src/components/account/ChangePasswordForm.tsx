import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateMyPassword } from '../../api/account';

interface ChangePasswordFormProps {
  className?: string;
  onSuccess?: () => void;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ className = '', onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }

    if (!newPassword) {
      toast.error('New password is required.');
      return;
    }

    if (!confirmPassword) {
      toast.error('Confirm password is required.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await updateMyPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      toast.success(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess?.();
    } catch (err: unknown) {
      let msg = 'Failed to change password.';
      if (err && typeof err === 'object') {
        const errorObj = err as Record<string, unknown>;
        const response = errorObj.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;
        if (typeof data?.message === 'string') {
          msg = data.message;
        } else if (err instanceof Error) {
          msg = err.message;
        }
      }
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={`rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden ${className}`}>
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <Lock className="h-5 w-5 text-blue-700" />
          Change Password
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Current Password</label>
          <div className="relative mt-1.5">
            <input
              required
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword((prev) => !prev)}
              aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">New Password</label>
          <div className="relative mt-1.5">
            <input
              required
              minLength={8}
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((prev) => !prev)}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
          <div className="relative mt-1.5">
            <input
              required
              minLength={8}
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              disabled={isSubmitting}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Change Password
          </button>
        </div>
      </form>
    </section>
  );
};

export default ChangePasswordForm;
