import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import RefSectionsView from './RefSectionsView';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';
import { Home, Info, GraduationCap, Briefcase, Palette } from 'lucide-react';

export default function GuestDashboard() {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<MenuTab>('home');

  const guestMenuCategories: MenuCategory[] = [
    {
      id: 'homepage',
      label: 'Ana Sayfa',
      items: [
        { id: 'home', label: 'Ana Sayfa', icon: Home },
        { id: 'about', label: 'Hakkımızda', icon: Info },
      ],
    },
    {
      id: 'ref_sections',
      label: 'Ref Bölümleri',
      items: [
        { id: 'ref_akademi', label: 'Ref Akademi', icon: GraduationCap },
        { id: 'ref_danismanlik', label: 'Ref Danışmanlık', icon: Briefcase },
        { id: 'ref_atolye', label: 'Ref Atölye', icon: Palette },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        userFullName="Misafir"
        menuCategories={guestMenuCategories}
        panelTitle="Misafir Paneli"
      />

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <HomePage
            onNavigateToAbout={() => setActiveTab('about')}
            userFullName="Misafir"
            onSignOut={signOut}
          />
        )}
        {activeTab === 'about' && (
          <AboutPage onNavigateHome={() => setActiveTab('home')} />
        )}
        {activeTab === 'ref_akademi' && (
          <div className="p-8">
            <RefSectionsView sectionType="ref_akademi" />
          </div>
        )}
        {activeTab === 'ref_danismanlik' && (
          <div className="p-8">
            <RefSectionsView sectionType="ref_danismanlik" />
          </div>
        )}
        {activeTab === 'ref_atolye' && (
          <div className="p-8">
            <RefSectionsView sectionType="ref_atolye" />
          </div>
        )}
      </main>
    </div>
  );
}
