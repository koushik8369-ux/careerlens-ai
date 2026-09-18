import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Sparkles, Home, LayoutDashboard, Info, LogIn, LogOut, UserCircle2, FileText, Briefcase, Bot, CalendarCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resume-analyzer', label: 'Resume Analyzer', icon: FileText },
    { to: '/job-intelligence', label: 'Job Intelligence', icon: Briefcase },
    { to: '/career-assistant', label: 'Career Assistant', icon: Bot },
    { to: '/career-plan', label: 'Career Plan', icon: CalendarCheck },
    { to: '/profile', label: 'Profile', icon: UserCircle2 },
    { to: '/about', label: 'About', icon: Info },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand / Logo */}
          <NavLink
            to="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02] shrink-0"
            id="brand-logo"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-brand-500/25 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
                CareerLens AI
              </span>
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase -mt-1">
                Career Intelligence
              </span>
            </div>
          </NavLink>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 sm:gap-2 flex-1 justify-center" id="main-nav">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                id={`nav-link-${label.toLowerCase()}`}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Auth controls */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                {/* User badge */}
                <div
                  id="nav-user-badge"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-sm text-slate-300"
                >
                  <UserCircle2 className="w-4 h-4 text-brand-400" />
                  <span className="max-w-[120px] truncate font-medium">{user.fullName}</span>
                </div>
                {/* Logout */}
                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
                  aria-label="Log out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                id="nav-login-btn"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold
                           bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500
                           text-white shadow-md shadow-brand-500/20 transition-all duration-200 hover:scale-[1.02]"
              >
                <LogIn className="w-4 h-4" />
                <span>Login</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in" id="main-content">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} CareerLens AI — Smart Career Intelligence Platform Foundation</p>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;

