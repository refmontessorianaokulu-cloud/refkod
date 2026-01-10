import { useState, useEffect } from 'react';
import {
  Baby,
  Users,
  Calendar,
  Sparkles,
  BookOpen,
  Megaphone,
  MessageSquare,
  CalendarCheck,
  CreditCard,
  ClipboardList,
  UtensilsCrossed,
  UserCheck,
  Car,
  Bell,
  Package,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
} from 'lucide-react';

export type MenuTab =
  | 'children'
  | 'users'
  | 'attendance'
  | 'montessori_reports'
  | 'branch_reports'
  | 'behavior_incidents'
  | 'announcements'
  | 'messages'
  | 'calendar'
  | 'fees'
  | 'appointments'
  | 'tasks'
  | 'menu'
  | 'duty'
  | 'services'
  | 'cleaning'
  | 'material_requests'
  | 'inquiries'
  | 'reference_applications';

interface MenuItem {
  id: MenuTab;
  label: string;
  icon: any;
}

interface MenuCategory {
  id: string;
  label: string;
  items: MenuItem[];
}

interface SidebarProps {
  activeTab: MenuTab;
  onTabChange: (tab: MenuTab) => void;
  onSignOut: () => void;
  userFullName?: string;
  pendingUsersCount?: number;
}

const menuCategories: MenuCategory[] = [
  {
    id: 'student_management',
    label: 'Öğrenci Yönetimi',
    items: [
      { id: 'children', label: 'Çocuklar', icon: Baby },
      { id: 'users', label: 'Kullanıcılar', icon: Users },
      { id: 'attendance', label: 'Devamsızlık', icon: Calendar },
    ],
  },
  {
    id: 'reports',
    label: 'Raporlar ve Değerlendirme',
    items: [
      { id: 'montessori_reports', label: 'Montessori Raporları', icon: Sparkles },
      { id: 'branch_reports', label: 'Branş Dersleri', icon: BookOpen },
      { id: 'behavior_incidents', label: 'KOD Kayıtları', icon: AlertTriangle },
    ],
  },
  {
    id: 'communication',
    label: 'İletişim',
    items: [
      { id: 'announcements', label: 'Duyurular', icon: Megaphone },
      { id: 'messages', label: 'Mesajlar', icon: MessageSquare },
      { id: 'calendar', label: 'Akademik Takvim', icon: Calendar },
    ],
  },
  {
    id: 'finance',
    label: 'Finans ve Randevular',
    items: [
      { id: 'fees', label: 'Okul Ödemeleri', icon: CreditCard },
      { id: 'appointments', label: 'Randevular', icon: CalendarCheck },
    ],
  },
  {
    id: 'operations',
    label: 'Operasyonel Yönetim',
    items: [
      { id: 'tasks', label: 'Görevlendirmeler', icon: ClipboardList },
      { id: 'menu', label: 'Yemek Menüsü', icon: UtensilsCrossed },
      { id: 'duty', label: 'Nöbetçi Öğretmen', icon: UserCheck },
    ],
  },
  {
    id: 'services',
    label: 'Hizmetler ve Talepler',
    items: [
      { id: 'services', label: 'Servis Takibi', icon: Car },
      { id: 'cleaning', label: 'Temizlik', icon: Sparkles },
      { id: 'material_requests', label: 'Malzeme Talepleri', icon: Package },
      { id: 'inquiries', label: 'Bilgi Talepleri', icon: Bell },
    ],
  },
  {
    id: 'applications',
    label: 'Başvurular',
    items: [
      { id: 'reference_applications', label: 'Referans Öğretmen', icon: FileText },
    ],
  },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onSignOut,
  userFullName,
  pendingUsersCount = 0,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('sidebar-expanded-categories');
    if (saved) {
      return JSON.parse(saved);
    }
    const activeCategory = menuCategories.find(cat =>
      cat.items.some(item => item.id === activeTab)
    );
    return activeCategory ? [activeCategory.id] : [];
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    localStorage.setItem('sidebar-expanded-categories', JSON.stringify(expandedCategories));
  }, [expandedCategories]);

  useEffect(() => {
    const activeCategory = menuCategories.find(cat =>
      cat.items.some(item => item.id === activeTab)
    );
    if (activeCategory && !expandedCategories.includes(activeCategory.id)) {
      setExpandedCategories(prev => [...prev, activeCategory.id]);
    }
  }, [activeTab]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleMenuItemClick = (tabId: MenuTab) => {
    onTabChange(tabId);
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      <div className={`flex items-center justify-between p-4 border-b border-gray-700 ${isCollapsed ? 'flex-col' : ''}`}>
        <div className={`flex items-center space-x-3 ${isCollapsed ? 'mb-2' : ''}`}>
          <img
            src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
            alt="REF Logo"
            className="w-10 h-10 object-contain rounded-lg"
          />
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-white">Yönetici Paneli</h1>
              {userFullName && (
                <p className="text-xs text-gray-300 truncate max-w-[160px]">{userFullName}</p>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1 scrollbar-thin">
        {menuCategories.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);
          return (
            <div key={category.id}>
              <button
                onClick={() => toggleCategory(category.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-all ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={isCollapsed ? category.label : ''}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  )}
                  {!isCollapsed && <span className="truncate">{category.label}</span>}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-1 space-y-1">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    const showBadge = item.id === 'users' && pendingUsersCount > 0;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMenuItemClick(item.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-all ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-lg'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        } ${isCollapsed ? 'justify-center' : 'ml-6'}`}
                        title={isCollapsed ? item.label : ''}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!isCollapsed && (
                          <span className="truncate flex-1 text-left">{item.label}</span>
                        )}
                        {!isCollapsed && showBadge && (
                          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-yellow-500 text-gray-900 rounded-full">
                            {pendingUsersCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-gray-700 p-4 space-y-3">
        {!isCollapsed && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-2 px-3">Bizi Takip Edin</p>
            <div className="flex items-center justify-center space-x-2">
              <div
                className="p-2 text-gray-600 cursor-not-allowed rounded-lg opacity-50"
                title="Facebook (Yakında)"
              >
                <Facebook className="w-5 h-5" />
              </div>
              <a
                href="https://www.instagram.com/refcocukakademisi/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-pink-500 hover:bg-gray-700 rounded-lg transition-all"
                title="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <div
                className="p-2 text-gray-600 cursor-not-allowed rounded-lg opacity-50"
                title="Youtube (Yakında)"
              >
                <Youtube className="w-5 h-5" />
              </div>
              <div
                className="p-2 text-gray-600 cursor-not-allowed rounded-lg opacity-50"
                title="LinkedIn (Yakında)"
              >
                <Linkedin className="w-5 h-5" />
              </div>
              <a
                href="mailto:bilgi@refcocukakademisi.com"
                className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-gray-700 rounded-lg transition-all"
                title="E-posta"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="flex flex-col items-center space-y-2 mb-3">
            <div
              className="p-2 text-gray-600 cursor-not-allowed rounded-lg opacity-50"
              title="Facebook (Yakında)"
            >
              <Facebook className="w-4 h-4" />
            </div>
            <a
              href="https://www.instagram.com/refcocukakademisi/"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-pink-500 hover:bg-gray-700 rounded-lg transition-all"
              title="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <div
              className="p-2 text-gray-600 cursor-not-allowed rounded-lg opacity-50"
              title="Youtube (Yakında)"
            >
              <Youtube className="w-4 h-4" />
            </div>
            <div
              className="p-2 text-gray-600 cursor-not-allowed rounded-lg opacity-50"
              title="LinkedIn (Yakında)"
            >
              <Linkedin className="w-4 h-4" />
            </div>
            <a
              href="mailto:bilgi@refcocukakademisi.com"
              className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-gray-700 rounded-lg transition-all"
              title="E-posta"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          title={isCollapsed ? 'Genişlet' : 'Daralt'}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          />
          {!isCollapsed && <span>Daralt</span>}
        </button>
        <button
          onClick={onSignOut}
          className={`w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Çıkış Yap' : ''}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Çıkış Yap</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-3 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      <div
        className={`lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`fixed lg:sticky top-0 h-screen bg-gray-900 shadow-xl z-50 transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-64'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
