import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { AssistantPage } from './pages/AssistantPage';
import { CodingPage } from './pages/CodingPage';
import { CoverLettersPage } from './pages/CoverLettersPage';
import { DashboardPage } from './pages/DashboardPage';
import { InterviewsPage } from './pages/InterviewsPage';
import { JobsPage } from './pages/JobsPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { RecruiterPage } from './pages/RecruiterPage';
import { ResumesPage } from './pages/ResumesPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
    </AuthProvider>
  );
}
