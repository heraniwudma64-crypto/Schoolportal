import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, Lock, User, ArrowRight, Mail } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { APP_NAME, APP_DESCRIPTION } from '../../config/branding';
import { api, ApiError } from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type ResetStep = 'email' | 'otp' | 'reset';

// ─── Helper ───────────────────────────────────────────────────────────────────
/** Extract the most useful message from any thrown value. */
function extractMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Component ────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot-password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(idNumber, password);
      if (result.success) {
        toast.success('Login successful!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.error(result.error || 'Invalid credentials');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Reset helpers ──────────────────────────────────────────────────────────
  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetStep('email');
    setResetEmail('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Step 1: Send OTP — uses shared api client so VITE_API_URL is respected
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      await api.post<{ message: string }>('/auth/forgot-password', {
        email: resetEmail.trim(),
      });
      // Backend returns the same message whether the email exists or not
      // (security: no account enumeration). Always advance to OTP step.
      toast.success('If that email is registered, a reset code has been sent.');
      setResetStep('otp');
    } catch (err) {
      toast.error(extractMessage(err, 'Failed to send reset code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      toast.error('Please enter the OTP code');
      return;
    }
    setIsLoading(true);
    try {
      await api.post<{ message: string }>('/auth/verify-otp', {
        email: resetEmail.trim(),
        otp: otpCode.trim(),
      });
      toast.success('Code verified successfully');
      setResetStep('reset');
    } catch (err) {
      // Surface exact backend message, e.g. "Invalid or expired OTP code"
      toast.error(extractMessage(err, 'Invalid or expired code. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Set new password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      await api.post<{ message: string }>('/auth/reset-password', {
        email: resetEmail.trim(),
        otp: otpCode.trim(),
        newPassword,
      });
      toast.success('Password reset successfully! You can now log in.');
      closeForgotPassword();
    } catch (err) {
      // Surface exact backend message, e.g. "Invalid or expired password reset request"
      toast.error(extractMessage(err, 'Failed to reset password. Please start over.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-sm" />

      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-2xl relative z-10 mx-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <GraduationCap className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{APP_NAME}</h1>
          <p className="text-gray-500">{APP_DESCRIPTION}</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Number or Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="Enter your ID Number or Email"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => { setShowForgotPassword(true); setResetStep('email'); }}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Register now
            </Link>
          </p>
        </div>
      </div>

      <Toaster position="top-right" />

      {/* ── Multi-step password reset modal ── */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {(['email', 'otp', 'reset'] as const).map((step, i) => (
                <React.Fragment key={step}>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      resetStep === step
                        ? 'bg-blue-900 text-white'
                        : (['email', 'otp', 'reset'] as const).indexOf(resetStep) > i
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-0.5 transition-colors ${
                        (['email', 'otp', 'reset'] as const).indexOf(resetStep) > i
                          ? 'bg-green-500'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ── Step 1: Email ── */}
            {resetStep === 'email' && (
              <form onSubmit={handleSendOtp}>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Reset Password</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Enter the exact email address associated with your account. A 6-digit
                  code will be sent to that address.
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="your-registered@email.com"
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Must match the email saved on your account profile.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-70"
                  >
                    {isLoading ? 'Sending…' : 'Send Code'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 2: OTP ── */}
            {resetStep === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Enter Code</h2>
                <p className="text-gray-500 text-sm mb-6">
                  We sent a verification code to{' '}
                  <span className="font-semibold text-gray-800">{resetEmail}</span>.
                  It expires in 15 minutes.
                </p>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    6-digit Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 tracking-[0.5em] text-center text-lg font-mono"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResetStep('email')}
                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length < 6}
                    className="flex-1 py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-70"
                  >
                    {isLoading ? 'Verifying…' : 'Verify Code'}
                  </button>
                </div>
              </form>
            )}

            {/* ── Step 3: New password ── */}
            {resetStep === 'reset' && (
              <form onSubmit={handleResetPassword}>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">New Password</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Choose a new secure password for{' '}
                  <span className="font-semibold text-gray-800">{resetEmail}</span>.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-red-300'
                        : 'border-gray-200'
                    }`}
                    required
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || (!!confirmPassword && confirmPassword !== newPassword)}
                  className="w-full py-3 bg-blue-900 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors disabled:opacity-70"
                >
                  {isLoading ? 'Updating…' : 'Set New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
