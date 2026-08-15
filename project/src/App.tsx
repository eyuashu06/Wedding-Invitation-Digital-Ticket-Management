import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Layout } from "@/components/Layout";

const LandingPage = lazy(() => import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import("@/pages/AuthPage").then((m) => ({ default: m.AuthPage })));
const Dashboard = lazy(() => import("@/pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const WeddingsPage = lazy(() => import("@/pages/WeddingsPage").then((m) => ({ default: m.WeddingsPage })));
const WeddingDetailPage = lazy(() => import("@/pages/WeddingDetailPage").then((m) => ({ default: m.WeddingDetailPage })));
const GuestsPage = lazy(() => import("@/pages/GuestsPage").then((m) => ({ default: m.GuestsPage })));
const InvitationsPage = lazy(() => import("@/pages/InvitationsPage").then((m) => ({ default: m.InvitationsPage })));
const CheckInPage = lazy(() => import("@/pages/CheckInPage").then((m) => ({ default: m.CheckInPage })));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const GuestInvitationPage = lazy(() => import("@/pages/GuestInvitationPage").then((m) => ({ default: m.GuestInvitationPage })));

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gold-200 border-t-gold-600 dark:border-gold-900 dark:border-t-gold-400" />
        <p className="font-serif text-sm font-medium text-stone-500 dark:text-stone-400">Loading WeddingPass...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage mode="signin" />} />
        <Route path="/signup" element={<AuthPage mode="signup" />} />
        <Route path="/invite/:ticketId" element={<GuestInvitationPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/weddings" element={<ProtectedRoute><WeddingsPage /></ProtectedRoute>} />
        <Route path="/weddings/:id" element={<ProtectedRoute><WeddingDetailPage /></ProtectedRoute>} />
        <Route path="/guests" element={<ProtectedRoute><GuestsPage /></ProtectedRoute>} />
        <Route path="/invitations" element={<ProtectedRoute><InvitationsPage /></ProtectedRoute>} />
        <Route path="/check-in" element={<ProtectedRoute><CheckInPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
