import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import RequireVerified from './components/RequireVerified';
import NotFoundPage from './pages/NotFoundPage';
import HomePage from './pages/HomePage';
import ListingsPage from './pages/ListingsPage';
import ListingDetailPage from './pages/ListingDetailPage';
import CreateListingPage from './pages/CreateListingPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import SavedPage from './pages/SavedPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/terms" element={<Layout><TermsPage /></Layout>} />
          <Route path="/privacy" element={<Layout><PrivacyPage /></Layout>} />
          <Route path="/" element={<Layout><HomePage /></Layout>} />
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
      </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
