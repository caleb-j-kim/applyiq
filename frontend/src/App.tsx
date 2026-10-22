import { Route, Routes, useLocation } from 'react-router';

import { Toaster } from '@/components/ui/sonner';
import { MarketingLayout } from '@/components/layout/marketing-layout';
import { AppLayout } from '@/components/layout/app-layout';
import { RequireAuth } from '@/components/layout/require-auth';

import { HomePage } from '@/pages/home-page';
import { FeaturesPage } from '@/pages/features-page';
import { LoginPage } from '@/pages/login-page';
import { SignupPage } from '@/pages/signup-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { ApplicationsPage } from '@/pages/applications-page';
import { ResumeMatchPage } from '@/pages/resume-match-page';
import { ResumeMatchResultsPage } from '@/pages/resume-match-results-page';
import { ContactPage } from '@/pages/contact-page';
import { InterviewPrepPage } from '@/pages/interview-prep-page';
import { InterviewPrepResultsPage } from '@/pages/interview-prep-results-page';
import { FollowUpsPage } from '@/pages/follow-ups-page';
import { AnalyticsPage } from '@/pages/analytics-page';
import { ProfilePage } from '@/pages/profile-page';
import { UploadedResumesPage } from '@/pages/uploaded-resumes-page';
import { SettingsPage } from '@/pages/settings-page';
import { PrivacyPage, TermsPage } from '@/pages/legal-pages';

function App() {
  const location = useLocation();
  // A path-based router treats "/#features" as path "/" with a hash — so without this,
  // that exact URL would just render the home page. This renders the dedicated
  // FeaturesPage instead whenever the hash is #features, without adding any link/route
  // reference from the home page's own content.
  const atFeaturesHash = location.pathname === '/' && location.hash === '#features';

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={atFeaturesHash ? <FeaturesPage /> : <MarketingLayout><HomePage /></MarketingLayout>}
        />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/dashboard" element={<RequireAuth><AppLayout><DashboardPage /></AppLayout></RequireAuth>} />
        <Route path="/applications" element={<RequireAuth><AppLayout><ApplicationsPage /></AppLayout></RequireAuth>} />
        <Route path="/resume-match" element={<RequireAuth><AppLayout><ResumeMatchPage /></AppLayout></RequireAuth>} />
        <Route
          path="/resume-match/results"
          element={<RequireAuth><AppLayout><ResumeMatchResultsPage /></AppLayout></RequireAuth>}
        />
        <Route path="/interview-prep" element={<RequireAuth><AppLayout><InterviewPrepPage /></AppLayout></RequireAuth>} />
        <Route
          path="/interview-prep/results"
          element={<RequireAuth><AppLayout><InterviewPrepResultsPage /></AppLayout></RequireAuth>}
        />
        <Route path="/follow-ups" element={<RequireAuth><AppLayout><FollowUpsPage /></AppLayout></RequireAuth>} />
        <Route path="/analytics" element={<RequireAuth><AppLayout><AnalyticsPage /></AppLayout></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><AppLayout><ProfilePage /></AppLayout></RequireAuth>} />
        <Route path="/uploaded-resumes" element={<RequireAuth><AppLayout><UploadedResumesPage /></AppLayout></RequireAuth>} />
        <Route path="/settings" element={<RequireAuth><AppLayout><SettingsPage /></AppLayout></RequireAuth>} />
      </Routes>
    </>
  );
}

export default App;
