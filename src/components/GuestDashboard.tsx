import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import HomePage from './HomePage';
import AboutPage from './AboutPage';
import Sidebar, { MenuTab, MenuCategory } from './Sidebar';
import { Home, Info } from 'lucide-react';

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
      </main>
    </div>
  );
}
