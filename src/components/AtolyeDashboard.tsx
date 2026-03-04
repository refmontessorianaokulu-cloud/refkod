import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import RefSectionsView from './RefSectionsView';
import SearchModal from './SearchModal';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';
import { Home, Info, GraduationCap, Briefcase, Palette } from 'lucide-react';

export default function AtolyeDashboard() {
  const { signOut, guestInitialTab, guestInitialSection, user, profile } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<MenuTab>('ref_atolye');
  const [aboutInitialSection, setAboutInitialSection] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);

  useEffect(() => {
    if (guestInitialTab) {
      setActiveTab(guestInitialTab as MenuTab);
    }
    if (guestInitialSection) {
      setAboutInitialSection(guestInitialSection);
    }
  }, [guestInitialTab, guestInitialSection]);

  const menuCategories: MenuCategory[] = [
    {
      id: 'homepage',
      label: t('menu.homepage'),
      items: [
        { id: 'home', label: t('menu.home'), icon: Home },
        { id: 'about', label: t('menu.about'), icon: Info },
      ],
    },
    {
      id: 'ref_sections',
      label: t('menu.refEcosystem'),
      items: [
        { id: 'ref_akademi', label: t('menu.refAkademi'), icon: GraduationCap },
        { id: 'ref_danismanlik', label: t('menu.refDanismanlik'), icon: Briefcase },
        { id: 'ref_atolye', label: t('menu.refAtolye'), icon: Palette },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSignOut={signOut}
        userFullName={profile?.full_name || 'Atölye Kullanıcısı'}
        menuCategories={menuCategories}
        panelTitle="Atölye Paneli"
        isGuestMode={false}
        onSearchClick={() => setShowSearchModal(true)}
        mobileHeaderTitle={
          activeTab === 'ref_atolye' ? 'Ref Atölye' :
          activeTab === 'ref_danismanlik' ? 'Ref Danışmanlık' :
          activeTab === 'ref_akademi' ? 'Ref Akademi' :
          undefined
        }
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={setActiveTab}
        userRole="guest"
      />

      <main className="flex-1 overflow-y-auto">
        {activeTab === 'home' && (
          <HomePage
            onNavigateToAbout={() => setActiveTab('about')}
            userFullName={profile?.full_name || 'Atölye Kullanıcısı'}
            onSignOut={signOut}
          />
        )}
        {activeTab === 'about' && (
          <AboutPage
            onNavigateHome={() => setActiveTab('home')}
            initialSection={aboutInitialSection}
          />
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
            <RefSectionsView sectionType="ref_atolye" isAtolyeUser={true} />
          </div>
        )}
      </main>
    </div>
  );
}
