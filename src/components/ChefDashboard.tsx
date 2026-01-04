import { useAuth } from '../contexts/AuthContext';
import { LogOut, UtensilsCrossed } from 'lucide-react';
import MealMenuSection from './MealMenuSection';

export default function ChefDashboard() {
  const { signOut, profile } = useAuth();

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
                alt="REF Logo"
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Aşçı Paneli</h1>
                <p className="text-sm text-gray-500">{profile.full_name}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Çıkış</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex items-center space-x-2 px-6 py-4 font-medium border-b-2 border-orange-500 text-orange-600">
              <UtensilsCrossed className="w-5 h-5" />
              <span>Yemek Menüsü</span>
            </div>
          </div>

          <div className="p-6">
            <MealMenuSection userId={profile.id} userRole="chef" />
          </div>
        </div>
      </div>
    </div>
  );
}
