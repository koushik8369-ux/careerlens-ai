import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { RegisterRequest } from '../types';

interface FormState extends RegisterRequest {
  confirmPassword: string;
}

interface FieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const validateForm = (form: FormState): FieldErrors => {
  const errors: FieldErrors = {};
  if (!form.fullName.trim() || form.fullName.trim().length < 2)
    errors.fullName = 'Full name must be at least 2 characters.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = 'Please enter a valid email address.';
  if (form.password.length < 6)
    errors.password = 'Password must be at least 6 characters.';
  if (form.password !== form.confirmPassword)
    errors.confirmPassword = 'Passwords do not match.';
  return errors;
};

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServerError(null);
    setFieldErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    setServerError(null);
    try {
      await register({
        fullName: form.fullName.trim(),
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1800);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setServerError(
        axiosError?.response?.data?.message ||
          axiosError?.message ||
          'Registration failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 py-12 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.03]"
            id="register-brand-logo"
          >
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/30 ring-1 ring-white/20">
              <Sparkles className="w-6 h-6 text-white animate-pulse-subtle" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                CareerLens AI
              </span>
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase -mt-0.5">
                Career Intelligence
              </span>
            </div>
          </Link>
          <div className="text-center mt-1">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-sm text-slate-400 mt-1">
              Start your career intelligence journey today
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl p-8">
          {/* Success state */}
          {success && (
            <div
              id="register-success"
              className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-300"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Account created! Redirecting to login…</span>
            </div>
          )}

          {/* Server error */}
          {serverError && (
            <div
              id="register-error"
              className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Full name */}
            <div className="space-y-1.5">
              <label htmlFor="register-fullname" className="block text-sm font-medium text-slate-300">
                Full name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="register-fullname"
                  type="text"
                  name="fullName"
                  autoComplete="name"
                  required
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Koushik Gowda"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/60 transition-all duration-200
                    ${fieldErrors.fullName ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-xs text-red-400">{fieldErrors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-300">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/60 transition-all duration-200
                    ${fieldErrors.email ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-400">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/60 transition-all duration-200
                    ${fieldErrors.password ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
                <button
                  type="button"
                  id="register-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-400">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label htmlFor="register-confirm-password" className="block text-sm font-medium text-slate-300">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="register-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`w-full bg-slate-800/60 border rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/60 transition-all duration-200
                    ${fieldErrors.confirmPassword ? 'border-red-500/60' : 'border-slate-700/80'}`}
                />
                <button
                  type="button"
                  id="register-toggle-confirm"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-400">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading || success}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500
                         text-white text-sm font-semibold shadow-lg shadow-brand-500/25
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 hover:shadow-brand-500/40 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
              to="/login"
              id="register-login-link"
              className="font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
