import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { AboutPage } from './pages/AboutPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ProfilePage } from './pages/ProfilePage';
import { ResumeAnalyzerPage } from './pages/ResumeAnalyzerPage';
import { JobIntelligencePage } from './pages/JobIntelligencePage';
import { CareerAssistantPage } from './pages/CareerAssistantPage';
import { CareerPlanPage } from './pages/CareerPlanPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Standalone auth pages — full-screen, no AppLayout chrome */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Main app shell */}
          <Route path="/" element={<AppLayout />}>
            <Route index element={<HomePage />} />
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="resume-analyzer"
              element={
                <ProtectedRoute>
                  <ResumeAnalyzerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="job-intelligence"
              element={
                <ProtectedRoute>
                  <JobIntelligencePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="career-assistant"
              element={<ProtectedRoute><CareerAssistantPage /></ProtectedRoute>}
            />
            <Route
              path="career-plan"
              element={<ProtectedRoute><CareerPlanPage /></ProtectedRoute>}
            />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

