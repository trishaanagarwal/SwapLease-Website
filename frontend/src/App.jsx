import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import RequireVerified from './components/RequireVerified';

// Route-level code splitting: each page loads on demand, keeping the
// initial bundle small (matters most on mobile data).
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const SeekersPage = lazy(() => import('./pages/SeekersPage'));
const EditSeekerPage = lazy(() => import('./pages/EditSeekerPage'));
const ListingsPage = lazy(() => import('./pages/ListingsPage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const CreateListingPage = lazy(() => import('./pages/CreateListingPage'));
const MessagesPage = lazy(() => import('./pages/MessagesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SavedPage = lazy(() => import('./pages/SavedPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));

// Centered spinner shown while a page chunk loads.
function PageFallback() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E5E1D8', borderTopColor: '#1B3A6B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

// Logged-out visitors get the marketing landing page; members get their home.
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <HomePage /> : <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
          <Route path="/" element={<Layout><HomeRoute /></Layout>} />
          <Route path="/roommates" element={<Layout><SeekersPage /></Layout>} />
          <Route path="/roommates/edit" element={
            <Layout>
              <ProtectedRoute><RequireVerified action="post a request"><EditSeekerPage /></RequireVerified></ProtectedRoute>
            </Layout>
          } />
          <Route path="/listings" element={<Layout><ListingsPage /></Layout>} />
          <Route path="/listings/:id" element={<Layout><ListingDetailPage /></Layout>} />
          <Route path="/create-listing" element={
            <Layout>
              <ProtectedRoute><RequireVerified action="post a listing"><CreateListingPage /></RequireVerified></ProtectedRoute>
            </Layout>
          } />
          <Route path="/listings/:id/edit" element={
            <Layout>
              <ProtectedRoute><RequireVerified action="edit a listing"><CreateListingPage /></RequireVerified></ProtectedRoute>
            </Layout>
          } />
          <Route path="/messages" element={
            <Layout>
              <ProtectedRoute><RequireVerified action="send messages"><MessagesPage /></RequireVerified></ProtectedRoute>
            </Layout>
          } />
          <Route path="/profile" element={
            <Layout>
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            </Layout>
          } />
          <Route path="/saved" element={
            <Layout>
              <ProtectedRoute><SavedPage /></ProtectedRoute>
            </Layout>
          } />
          <Route path="*" element={<Layout><NotFoundPage /></Layout>} />
        </Routes>
        </Suspense>
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
