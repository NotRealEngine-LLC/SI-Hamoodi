// HAMOODI SyntheTech Intelligence — Application Entry
// Phase 04: Workspaces, Hubs, Files, Collaboration

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { WorkspaceManagementProvider } from './contexts/WorkspaceManagementContext';
import { FileProvider } from './contexts/FileContext';
import { IntelligenceProvider } from './contexts/IntelligenceContext';
import { SuperAgentProvider } from './contexts/SuperAgentContext';
import { MemoryProvider } from './contexts/MemoryContext';
import { SignInPage, SignUpPage, ForgotPasswordPage, UpdatePasswordPage, AuthCallbackPage, OnboardingPage } from './pages/AuthPages';
import { WorkspacePage } from './pages/WorkspacePage';
import { HubsPage } from './pages/HubsPage';
import { FilesPage } from './pages/FilesPage';
import { WorkspaceDashboard } from './pages/WorkspaceDashboard';
import { SuperAgentCommandCenter } from './pages/SuperAgentCommandCenter';
import { ExecutionHistoryPage } from './pages/ExecutionHistoryPage';
import { MemoryManagementPage, SecondBrainDashboard } from './pages/MemoryPages';
import { KnowledgeSearchUI } from './components/KnowledgeSearchUI';
import { KnowledgeSettingsPage } from './pages/KnowledgeSettingsPage';
import { IntegrationsHub } from './pages/IntegrationsHub';
import { IntegrationsProvider } from './contexts/IntegrationsContext';
import { OAuthCallbackHandler } from './pages/OAuthCallbackHandler';
import { ToolExplorer } from './pages/ToolExplorer';
import { StudiosHub } from './pages/StudiosHub';
import { ResearchStudio } from './pages/ResearchStudio';
import { DocsStudio } from './pages/DocsStudio';
import { SheetsStudio } from './pages/SheetsStudio';
import { SlidesStudio } from './pages/SlidesStudio';
import { CreativeStudio } from './pages/CreativeStudio';
import { DeveloperStudio } from './pages/DeveloperStudio';
import { AgentsHub } from './pages/AgentsHub';
import { AgentBuilder } from './pages/AgentBuilder';
import { AgentsProvider } from './contexts/AgentsContext';

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
          <IntelligenceProvider>
            <SuperAgentProvider>
              <MemoryProvider>
                <IntegrationsProvider>
                  <AgentsProvider>
                    {children}
                  </AgentsProvider>
                </IntegrationsProvider>
              </MemoryProvider>
            </SuperAgentProvider>
          </IntelligenceProvider>
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

      {/* Super Agent */}
      <Route path="/agents" element={
        <ProtectedRoute>
          <AppProviders>
            <SuperAgentCommandCenter />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Execution History */}
      <Route path="/agents/history" element={
        <ProtectedRoute>
          <AppProviders>
            <ExecutionHistoryPage />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Memory Management */}
      <Route path="/memory" element={
        <ProtectedRoute>
          <AppProviders>
            <MemoryManagementPage />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* SecondBrain Dashboard */}
      <Route path="/secondbrain" element={
        <ProtectedRoute>
          <AppProviders>
            <SecondBrainDashboard />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Knowledge Search */}
      <Route path="/knowledge/search" element={
        <ProtectedRoute>
          <AppProviders>
            <KnowledgeSearchUI />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Knowledge Settings */}
      <Route path="/knowledge/settings" element={
        <ProtectedRoute>
          <AppProviders>
            <KnowledgeSettingsPage />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Integrations */}
      <Route path="/integrations" element={
        <ProtectedRoute>
          <AppProviders>
            <IntegrationsHub />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Tool Explorer */}
      <Route path="/integrations/tools" element={
        <ProtectedRoute>
          <AppProviders>
            <ToolExplorer />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* OAuth Callback */}
      <Route path="/integrations/oauth/callback" element={
        <ProtectedRoute>
          <AppProviders>
            <OAuthCallbackHandler />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Studios */}
      <Route path="/studios" element={
        <ProtectedRoute>
          <AppProviders>
            <StudiosHub />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/research" element={
        <ProtectedRoute>
          <AppProviders>
            <ResearchStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/docs" element={
        <ProtectedRoute>
          <AppProviders>
            <DocsStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/docs/:id" element={
        <ProtectedRoute>
          <AppProviders>
            <DocsStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/sheets" element={
        <ProtectedRoute>
          <AppProviders>
            <SheetsStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/sheets/:id" element={
        <ProtectedRoute>
          <AppProviders>
            <SheetsStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/slides" element={
        <ProtectedRoute>
          <AppProviders>
            <SlidesStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/slides/:id" element={
        <ProtectedRoute>
          <AppProviders>
            <SlidesStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/creative" element={
        <ProtectedRoute>
          <AppProviders>
            <CreativeStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/creative/:id" element={
        <ProtectedRoute>
          <AppProviders>
            <CreativeStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/code" element={
        <ProtectedRoute>
          <AppProviders>
            <DeveloperStudio />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/studios/code/:id" element={
        <ProtectedRoute>
          <AppProviders>
            <DeveloperStudio />
          </AppProviders>
        </ProtectedRoute>
      } />

      {/* Agents & Automation */}
      <Route path="/agents" element={
        <ProtectedRoute>
          <AppProviders>
            <AgentsHub />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/agents/builder" element={
        <ProtectedRoute>
          <AppProviders>
            <AgentBuilder />
          </AppProviders>
        </ProtectedRoute>
      } />
      <Route path="/agents/custom/:id" element={
        <ProtectedRoute>
          <AppProviders>
            <AgentBuilder />
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
