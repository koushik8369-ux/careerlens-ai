import React from 'react';
import { Info, Layers, Cpu, Compass } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
          <Info className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-white">About CareerLens AI</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">
          A dedicated platform built to bridge the gap between academic education and modern industry skill requirements.
        </p>
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-3 text-brand-400">
            <Layers className="w-5 h-5" />
            <h2 className="text-base font-semibold text-white">Full-Stack Decoupled Architecture</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Built with React, Vite, TypeScript, and Tailwind CSS on the frontend, alongside a robust Java 21 and Spring Boot backend for enterprise-grade scalability.
          </p>
        </div>

        <div className="glass-card p-6 space-y-3">
          <div className="flex items-center gap-3 text-purple-400">
            <Cpu className="w-5 h-5" />
            <h2 className="text-base font-semibold text-white">Scalable Extensibility</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            Engineered with strict separation of concerns across controllers, services, repositories, DTOs, and exception handlers for seamless future feature additions.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="glass-panel p-6 rounded-2xl space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 font-medium text-sm">
          <Compass className="w-4 h-4" />
          <span>Platform Mission</span>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          Our objective is to empower students and aspiring professionals to systematically assess their skills, identify actionable industry gaps, and follow structured, data-driven learning paths toward their dream careers.
        </p>
      </div>
    </div>
  );
};

export default AboutPage;
