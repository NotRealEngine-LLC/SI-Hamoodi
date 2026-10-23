// HAMOODI SyntheTech Intelligence — Application Entry
// Phase 04: Workspaces, Hubs, Files, Collaboration

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { WorkspaceManagementProvider } from './contexts/WorkspaceManagementContext';
import { FileProvider } from './contexts/FileContext';
import { SignInPage, SignUpPage, ForgotPasswordPage, UpdatePasswordPage, AuthCallbackPage, OnboardingPage } from './pages/AuthPages';
import { WorkspacePage } from './pages/WorkspacePage';
import { HubsPage } from './pages/HubsPage';
import { FilesPage } from './pages/FilesPage';
import { WorkspaceDashboard } from './pages/WorkspaceDashboard';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  
  if (state === 'initializing') {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-lg font-bold text-white">⬡</span>
          </div>
          <p className="text-sm text-zinc-500">Initializing HAMOODI...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Auth redirect - if already authenticated, go to workspace
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  
  if (state === 'authenticated') {
    return <Navigate to="/workspace" replace />;
  }

  return <>{children}</>;
}

// All providers wrapper
function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <WorkspaceManagementProvider>
        <FileProvider>
          {children}
        </FileProvider>
      </WorkspaceManagementProvider>
    </WorkspaceProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth/sign-in" element={<AuthRedirect><SignInPage /></AuthRedirect>} />
      <Route path="/auth/sign-up" element={<AuthRedirect><SignUpPage /></AuthRedirect>} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      
      {/* Onboarding */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <AppProviders>
            <OnboardingPage />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Workspace dashboard (home) */}
      <Route path="/workspace" element={
        <ProtectedRoute>
          <AppProviders>
            <WorkspacePage />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Hubs */}
      <Route path="/hubs" element={
        <ProtectedRoute>
          <AppProviders>
            <WorkspacePage />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Files */}
      <Route path="/files" element={
        <ProtectedRoute>
          <AppProviders>
            <WorkspacePage />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/workspace" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
