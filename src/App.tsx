import { Route, Routes } from 'react-router';

import { MarketingLayout } from '@/components/layout/marketing-layout';
import { AppLayout } from '@/components/layout/app-layout';

import { HomePage } from '@/pages/home-page';
import { LoginPage } from '@/pages/login-page';
import { SignupPage } from '@/pages/signup-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { ApplicationsPage } from '@/pages/applications-page';
import { ResumeMatchPage } from '@/pages/resume-match-page';
import { InterviewPrepPage } from '@/pages/interview-prep-page';
import { FollowUpsPage } from '@/pages/follow-ups-page';
import { AnalyticsPage } from '@/pages/analytics-page';
import { ProfilePage } from '@/pages/profile-page';
import { UploadedResumesPage } from '@/pages/uploaded-resumes-page';
import { SettingsPage } from '@/pages/settings-page';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketingLayout><HomePage /></MarketingLayout>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
      <Route path="/applications" element={<AppLayout><ApplicationsPage /></AppLayout>} />
      <Route path="/resume-match" element={<AppLayout><ResumeMatchPage /></AppLayout>} />
      <Route path="/interview-prep" element={<AppLayout><InterviewPrepPage /></AppLayout>} />
      <Route path="/follow-ups" element={<AppLayout><FollowUpsPage /></AppLayout>} />
      <Route path="/analytics" element={<AppLayout><AnalyticsPage /></AppLayout>} />
      <Route path="/profile" element={<AppLayout><ProfilePage /></AppLayout>} />
      <Route path="/uploaded-resumes" element={<AppLayout><UploadedResumesPage /></AppLayout>} />
      <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
    </Routes>
  );
}

export default App;
