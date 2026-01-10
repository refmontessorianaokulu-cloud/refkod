import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import RefSectionsView from './RefSectionsView';
import SearchModal from './SearchModal';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';
import { Home, Info, GraduationCap, Briefcase, Palette, Search as SearchIcon } from 'lucide-react';

export default function GuestDashboard() {
  const { signOut, guestInitialTab, guestInitialSection } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<MenuTab>('home');
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

  const guestMenuCategories: MenuCategory[] = [
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
        userFullName={t('sidebar.guestPanel')}
        menuCategories={guestMenuCategories}
        panelTitle={t('sidebar.guestPanel')}
      />

      <button
        onClick={() => setShowSearchModal(true)}
        className="fixed top-4 right-4 z-40 p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-lg transition-all"
        title={t('search.placeholder')}
      >
        <SearchIcon className="w-5 h-5" />
      </button>

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
            userFullName="Misafir"
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
            <RefSectionsView sectionType="ref_atolye" />
          </div>
        )}
      </main>
    </div>
  );
}
