import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
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
    <div className="center-fill"><div className="spinner" role="status" aria-label="Loading" /></div>
  );
}

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main id="content" className="app-main">{children}</main>
      <Footer />
    </>
  );
}

// Logged-out visitors get the marketing landing page; members get their home.
function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Layout><HomePage /></Layout> : <LandingPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<Layout><LoginPage /></Layout>} />
          <Route path="/signup" element={<Layout><SignupPage /></Layout>} />
          <Route path="/verify-email" element={<Layout><VerifyEmailPage /></Layout>} />
          <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
          <Route path="/" element={<HomeRoute />} />
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
