import { lazy, Suspense } from 'react';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import PasswordReset from './components/PasswordReset';

const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const ParentDashboard = lazy(() => import('./components/ParentDashboard'));
const GuidanceCounselorDashboard = lazy(() => import('./components/GuidanceCounselorDashboard'));
const StaffDashboard = lazy(() => import('./components/StaffDashboard'));
const GuestDashboard = lazy(() => import('./components/GuestDashboard'));
const AtolyeDashboard = lazy(() => import('./components/AtolyeDashboard'));

function App() {
  const { user, profile, loading, isGuest } = useAuth();

  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const isRecoveryMode = hashParams.get('type') === 'recovery';

  if (isRecoveryMode) {
    return <PasswordReset onSuccess={() => {
      window.location.hash = '';
      window.location.href = '/';
    }} />;
  }

  const LoadingSpinner = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (isGuest) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <GuestDashboard />
      </Suspense>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  if (profile.staff_role) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <StaffDashboard />
      </Suspense>
    );
  }

  switch (profile.role) {
    case 'admin':
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <AdminDashboard />
        </Suspense>
      );
    case 'teacher':
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <TeacherDashboard />
        </Suspense>
      );
    case 'parent':
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <ParentDashboard />
        </Suspense>
      );
    case 'guidance_counselor':
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <GuidanceCounselorDashboard />
        </Suspense>
      );
    case 'atolye_user':
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <AtolyeDashboard />
        </Suspense>
      );
    default:
      return <Login />;
  }
}

export default App;
