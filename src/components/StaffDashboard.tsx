import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, UtensilsCrossed, Sparkles, Car, Baby, Package, AlertTriangle } from 'lucide-react';
import MealMenuSection from './MealMenuSection';
import CleaningRequestsSection from './CleaningRequestsSection';
import ToiletNotificationsSection from './ToiletNotificationsSection';
import BusDriverServiceSection from './BusDriverServiceSection';
import MaterialRequestsSection from './MaterialRequestsSection';
import BehaviorIncidentSection from './BehaviorIncidentSection';

export default function StaffDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'main' | 'requests' | 'notifications' | 'menu' | 'service' | 'material_requests' | 'behavior_incidents'>('main');

  const getStaffTitle = () => {
    if (profile?.staff_role === 'cook') return 'Aşçı Paneli';
    if (profile?.staff_role === 'cleaning_staff') return 'Temizlik Personeli Paneli';
    if (profile?.staff_role === 'bus_driver') return 'Servis Şoförü Paneli';
    if (profile?.staff_role === 'security_staff') return 'Güvenlik Paneli';
    if (profile?.staff_role === 'toilet_attendant') return 'Tuvalet Ablası Paneli';
    return 'Personel Paneli';
  };

  const showMenuTab = profile?.staff_role === 'cook';
  const showCleaningTab = profile?.staff_role === 'cleaning_staff';
  const showToiletTab = profile?.staff_role === 'toilet_attendant';
  const showServiceTab = profile?.staff_role === 'bus_driver';

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
                <h1 className="text-xl font-bold text-gray-800">{getStaffTitle()}</h1>
                <p className="text-sm text-gray-500">{profile?.full_name}</p>
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
            <div className="flex">
              {showMenuTab && (
                <button
                  onClick={() => setActiveTab('menu')}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === 'menu'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <UtensilsCrossed className="w-5 h-5" />
                  <span>Yemek Menüsü</span>
                </button>
              )}
              {showCleaningTab && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === 'requests'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Temizlik İstekleri</span>
                </button>
              )}
              {showToiletTab && (
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === 'notifications'
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Baby className="w-5 h-5" />
                  <span>Tuvalet Bildirimleri</span>
                </button>
              )}
              {showServiceTab && (
                <button
                  onClick={() => setActiveTab('service')}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                    activeTab === 'service'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Car className="w-5 h-5" />
                  <span>Servis Çocukları</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('material_requests')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'material_requests'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Package className="w-5 h-5" />
                <span>Malzeme Talepleri</span>
              </button>
              <button
                onClick={() => setActiveTab('behavior_incidents')}
                className={`flex items-center space-x-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === 'behavior_incidents'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
                <span>KOD Kayıtları</span>
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'menu' && showMenuTab && (
              <MealMenuSection userId={profile?.id || ''} userRole="staff" />
            )}

            {activeTab === 'requests' && showCleaningTab && (
              <CleaningRequestsSection userId={profile?.id || ''} userRole="staff" />
            )}

            {activeTab === 'notifications' && showToiletTab && (
              <ToiletNotificationsSection />
            )}

            {activeTab === 'service' && showServiceTab && (
              <BusDriverServiceSection driverId={profile?.id || ''} />
            )}

            {activeTab === 'material_requests' && (
              <MaterialRequestsSection
                userId={profile?.id || ''}
                userRole="staff"
                staffRole={profile?.staff_role}
              />
            )}

            {activeTab === 'behavior_incidents' && profile && (
              <BehaviorIncidentSection
                userId={profile.id}
                userRole="staff"
              />
            )}

            {activeTab === 'main' && (
              <div className="text-center py-12">
                <div className="mb-4">
                  {profile?.staff_role === 'cook' && <UtensilsCrossed className="w-16 h-16 text-orange-500 mx-auto" />}
                  {profile?.staff_role === 'cleaning_staff' && <Sparkles className="w-16 h-16 text-blue-500 mx-auto" />}
                  {profile?.staff_role === 'toilet_attendant' && <Baby className="w-16 h-16 text-teal-500 mx-auto" />}
                  {profile?.staff_role === 'bus_driver' && <Car className="w-16 h-16 text-green-500 mx-auto" />}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Hoş Geldiniz, {profile?.full_name}
                </h2>
                <p className="text-gray-600">
                  {showMenuTab && 'Yemek menüsünü yönetmek için yukarıdaki sekmeyi kullanın'}
                  {showCleaningTab && 'Temizlik isteklerini görmek için yukarıdaki sekmeyi kullanın'}
                  {showToiletTab && 'Tuvalet bildirimlerini görmek için yukarıdaki sekmeyi kullanın'}
                  {showServiceTab && 'Servis kullanan çocukları görmek için yukarıdaki sekmeyi kullanın'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
