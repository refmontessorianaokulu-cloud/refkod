import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ParentDashboard from './components/ParentDashboard';
import GuidanceCounselorDashboard from './components/GuidanceCounselorDashboard';
import StaffDashboard from './components/StaffDashboard';
import GuestDashboard from './components/GuestDashboard';
import PasswordReset from './components/PasswordReset';

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (isGuest) {
    return <GuestDashboard />;
  }

  if (!user || !profile) {
    return <Login />;
  }

  if (profile.staff_role) {
    return <StaffDashboard />;
  }

  switch (profile.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'parent':
      return <ParentDashboard />;
    case 'guidance_counselor':
      return <GuidanceCounselorDashboard />;
    default:
      return <Login />;
  }
}

export default App;
