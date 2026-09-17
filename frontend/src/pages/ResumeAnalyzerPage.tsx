import React, { useState, useEffect } from 'react';
import { FileUploadDropzone } from '../components/resume/FileUploadDropzone';
import { ResumeResultView } from '../components/resume/ResumeResultView';
import { analyzeResume, getResumeHistory } from '../services/resumeService';
import type { ResumeAnalysisResponse } from '../types';
import { Sparkles, History, FileText, ArrowRight, Target, Calendar } from 'lucide-react';

export const ResumeAnalyzerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'history'>('analyzer');
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<ResumeAnalysisResponse[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setIsHistoryLoading(true);
    try {
      const data = await getResumeHistory();
      setHistory(data);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleAnalyze = async (file: File, targetRole: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeResume(file, targetRole);
      setAnalysisResult(result);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to analyze resume. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoryItem = (item: ResumeAnalysisResponse) => {
    setAnalysisResult(item);
    setActiveTab('analyzer');
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-brand-400" />
            Resume Analyzer
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Scan your resume against ATS criteria and target job roles with CareerLens AI.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'analyzer'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Analyze</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'analyzer' ? (
        analysisResult ? (
          <ResumeResultView
            analysis={analysisResult}
            onReset={() => setAnalysisResult(null)}
          />
        ) : (
          <FileUploadDropzone
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            error={error}
          />
        )
      ) : (
        /* History View */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <History className="w-5 h-5 text-brand-400" />
              Past Resume Scans
            </h2>
            <button
              onClick={fetchHistory}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          {isHistoryLoading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
              <span>Loading scan history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <p>No previous resume analyses found. Upload your first resume to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectHistoryItem(item)}
                  className="bg-slate-900/60 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-5 transition-all duration-200 cursor-pointer hover:scale-[1.01] shadow-lg group flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-brand-300 transition-colors truncate max-w-[200px]">
                          {item.fileName}
                        </h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-extrabold text-slate-100">
                        {item.overallScore}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/100</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-purple-400" />
                      {item.targetRole || 'Software Engineer'}
                    </span>
                    <span className="text-brand-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      View Report
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
