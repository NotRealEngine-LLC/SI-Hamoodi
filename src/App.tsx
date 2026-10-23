// HAMOODI SyntheTech Intelligence — Application Entry
// Phase 03: Secure Authentication & Cloud Database

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { SignInPage, SignUpPage, ForgotPasswordPage, UpdatePasswordPage, AuthCallbackPage } from './pages/AuthPages';
import { WorkspacePage } from './pages/WorkspacePage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();
  
  // Allow both authenticated and guest users to access workspace
  // but show appropriate content based on auth state
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

function AppRoutes() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route path="/auth/sign-in" element={<AuthRedirect><SignInPage /></AuthRedirect>} />
      <Route path="/auth/sign-up" element={<AuthRedirect><SignUpPage /></AuthRedirect>} />
      <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/auth/update-password" element={<UpdatePasswordPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Workspace */}
      <Route path="/workspace" element={
        <ProtectedRoute>
          <WorkspaceProvider>
            <WorkspacePage />
          </WorkspaceProvider>
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
