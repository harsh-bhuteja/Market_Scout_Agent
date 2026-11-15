import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ResearchStoreProvider } from './hooks/useResearchStore';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NewResearchPage } from './pages/NewResearchPage';
import { WorkflowPage } from './pages/WorkflowPage';
import { ReportPage } from './pages/ReportPage';
import { ReportsIndexPage } from './pages/ReportsIndexPage';
import { HistoryPage } from './pages/HistoryPage';
import { HITLSandboxPage } from './pages/HITLSandboxPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ResearchStoreProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes wrapped in AppLayout and ProtectedRoute */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <DashboardPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/research/new"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <NewResearchPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/workflow"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <WorkflowPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/report/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReportPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <ReportsIndexPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <HistoryPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/hitl-sandbox"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <HITLSandboxPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ResearchStoreProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
