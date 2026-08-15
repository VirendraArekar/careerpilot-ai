import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

const ApplicationsPage = lazy(() =>
  import('./pages/ApplicationsPage').then((module) => ({ default: module.ApplicationsPage }))
);
const AssistantPage = lazy(() =>
  import('./pages/AssistantPage').then((module) => ({ default: module.AssistantPage }))
);
const CodingPage = lazy(() =>
  import('./pages/CodingPage').then((module) => ({ default: module.CodingPage }))
);
const CoverLettersPage = lazy(() =>
  import('./pages/CoverLettersPage').then((module) => ({ default: module.CoverLettersPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
);
const InterviewsPage = lazy(() =>
  import('./pages/InterviewsPage').then((module) => ({ default: module.InterviewsPage }))
);
const JobsPage = lazy(() =>
  import('./pages/JobsPage').then((module) => ({ default: module.JobsPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage }))
);
const RecruiterPage = lazy(() =>
  import('./pages/RecruiterPage').then((module) => ({ default: module.RecruiterPage }))
);
const ResumesPage = lazy(() =>
  import('./pages/ResumesPage').then((module) => ({ default: module.ResumesPage }))
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading workspace…</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="resumes" element={<ResumesPage />} />
              <Route path="jobs" element={<JobsPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="cover-letters" element={<CoverLettersPage />} />
              <Route path="interviews" element={<InterviewsPage />} />
              <Route path="coding" element={<CodingPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="recruiter" element={<RecruiterPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AuthProvider>
  );
}
