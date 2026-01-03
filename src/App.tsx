import { useAuth } from './contexts/AuthContext';
import { useState, useEffect } from 'react';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import ParentDashboard from './components/ParentDashboard';
import GuidanceCounselorDashboard from './components/GuidanceCounselorDashboard';
import StaffDashboard from './components/StaffDashboard';
import PasswordReset from './components/PasswordReset';

function App() {
  const { user, profile, loading } = useAuth();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get('type') === 'recovery') {
      setIsPasswordReset(true);
    }
  }, []);

  if (isPasswordReset) {
    return <PasswordReset onSuccess={() => {
      setIsPasswordReset(false);
      window.location.hash = '';
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
