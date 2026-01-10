import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UtensilsCrossed, Sparkles, Car, Baby, Package, AlertTriangle, Home, Info, GraduationCap, Briefcase, Palette } from 'lucide-react';
import MealMenuSection from './MealMenuSection';
import CleaningRequestsSection from './CleaningRequestsSection';
import ToiletNotificationsSection from './ToiletNotificationsSection';
import BusDriverServiceSection from './BusDriverServiceSection';
import MaterialRequestsSection from './MaterialRequestsSection';
import BehaviorIncidentSection from './BehaviorIncidentSection';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import RefSectionsView from './RefSectionsView';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';

export default function StaffDashboard() {
  const { signOut, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<MenuTab>('home');

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

  const getStaffMenuCategories = (): MenuCategory[] => {
    const categories: MenuCategory[] = [];

    categories.push({
      id: 'homepage',
      label: 'Ana Sayfa',
      items: [
        { id: 'home', label: 'Ana Sayfa', icon: Home },
        { id: 'about', label: 'Hakkımızda', icon: Info },
      ],
    });

    categories.push({
      id: 'ref_sections',
      label: 'Ref Ekosistemi',
      items: [
        { id: 'ref_akademi', label: 'Ref Akademi', icon: GraduationCap },
        { id: 'ref_danismanlik', label: 'Ref Danışmanlık', icon: Briefcase },
        { id: 'ref_atolye', label: 'Ref Atölye', icon: Palette },
      ],
    });

    const roleSpecificItems: any[] = [];

    if (showMenuTab) {
      roleSpecificItems.push({ id: 'menu', label: 'Yemek Menüsü', icon: UtensilsCrossed });
    }
    if (showCleaningTab) {
      roleSpecificItems.push({ id: 'cleaning', label: 'Temizlik İstekleri', icon: Sparkles });
    }
    if (showToiletTab) {
      roleSpecificItems.push({ id: 'notifications', label: 'Tuvalet Bildirimleri', icon: Baby });
    }
    if (showServiceTab) {
      roleSpecificItems.push({ id: 'service', label: 'Servis Çocukları', icon: Car });
    }

    if (roleSpecificItems.length > 0) {
      categories.push({
        id: 'role_specific',
        label: 'Görevlerim',
        items: roleSpecificItems,
      });
    }

    categories.push({
      id: 'general',
      label: 'Genel',
      items: [
        { id: 'material_requests', label: 'Malzeme Talepleri', icon: Package },
        { id: 'behavior_incidents', label: 'KOD Kayıtları', icon: AlertTriangle },
      ],
    });

    return categories;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        userFullName={profile?.full_name}
        userRole="staff"
        menuCategories={getStaffMenuCategories()}
        panelTitle={getStaffTitle()}
      />

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 lg:py-8">
          {activeTab === 'home' && (
            <HomePage
              onNavigateToAbout={() => setActiveTab('about')}
              userFullName={profile?.full_name}
              onSignOut={signOut}
            />
          )}

          {activeTab === 'about' && (
            <AboutPage onNavigateHome={() => setActiveTab('home')} />
          )}

          {activeTab !== 'home' && activeTab !== 'about' && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {activeTab === 'menu' && showMenuTab && (
                <MealMenuSection userId={profile?.id || ''} userRole="staff" />
              )}

              {activeTab === 'cleaning' && showCleaningTab && (
                <CleaningRequestsSection userId={profile?.id || ''} userRole="staff" />
              )}

              {activeTab === 'notifications' && showToiletTab && (
                <ToiletNotificationsSection />
              )}

              {activeTab === 'service' && showServiceTab && (
                <BusDriverServiceSection userId={profile?.id || ''} />
              )}

              {activeTab === 'material_requests' && (
                <MaterialRequestsSection userId={profile?.id || ''} userRole="staff" />
              )}

              {activeTab === 'behavior_incidents' && profile && (
                <BehaviorIncidentSection userId={profile.id} userRole="staff" />
              )}

              {activeTab === 'ref_akademi' && (
                <RefSectionsView sectionType="ref_akademi" />
              )}

              {activeTab === 'ref_danismanlik' && (
                <RefSectionsView sectionType="ref_danismanlik" />
              )}

              {activeTab === 'ref_atolye' && (
                <RefSectionsView sectionType="ref_atolye" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
