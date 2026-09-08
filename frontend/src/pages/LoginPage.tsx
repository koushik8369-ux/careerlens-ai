import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { LoginRequest } from '../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // After login, go back to where the user came from (defaulting to /dashboard)
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    '/dashboard';

  const [form, setForm] = useState<LoginRequest>({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setError(
        axiosError?.response?.data?.message ||
          axiosError?.message ||
          'Login failed. Please check your credentials.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Ambient background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md animate-fade-in">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.03]"
            id="login-brand-logo"
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
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1">
              Sign in to your account to continue
            </p>
          </div>
        </div>

        {/* Glass form card */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl p-8">
          {/* Error banner */}
          {error && (
            <div
              id="login-error"
              className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-slate-300"
              >
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/60
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full bg-slate-800/60 border border-slate-700/80 rounded-xl pl-10 pr-11 py-2.5 text-sm text-slate-100 placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500/60
                             transition-all duration-200"
                />
                <button
                  type="button"
                  id="login-toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !form.email || !form.password}
              className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500
                         text-white text-sm font-semibold shadow-lg shadow-brand-500/25
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-all duration-200 hover:shadow-brand-500/40 hover:scale-[1.01] active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="mt-6 text-center text-sm text-slate-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              id="login-register-link"
              className="font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
