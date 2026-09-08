import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 text-brand-400 shadow-xl">
        <HelpCircle className="w-12 h-12 animate-pulse-subtle" />
      </div>

      <div className="space-y-2">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white">404</h1>
        <h2 className="text-xl font-semibold text-slate-200">Page Not Found</h2>
        <p className="text-sm text-slate-400 max-w-sm mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>

      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-medium shadow-lg shadow-brand-600/25 transition-all duration-200"
        id="btn-return-home"
      >
        <Home className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;
