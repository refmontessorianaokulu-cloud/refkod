import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
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
  Home,
  Info,
  Edit,
  Settings,
  User,
  Phone,
  GraduationCap,
  Briefcase,
  Palette,
  Video,
} from 'lucide-react';

export type MenuTab =
  | 'home'
  | 'about'
  | 'children'
  | 'users'
  | 'attendance'
  | 'montessori_reports'
  | 'daily_reports'
  | 'branch_reports'
  | 'teacher_assignments'
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
  | 'service'
  | 'cleaning'
  | 'material_requests'
  | 'inquiries'
  | 'reference_applications'
  | 'content_management'
  | 'settings_management'
  | 'video_settings'
  | 'main'
  | 'task_responses'
  | 'group_messages'
  | 'service_location'
  | 'notifications'
  | 'ref_akademi'
  | 'ref_danismanlik'
  | 'ref_atolye'
  | 'ref_management';

export interface MenuItem {
  id: MenuTab;
  label: string;
  icon: any;
}

export interface MenuCategory {
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
  userRole?: 'admin' | 'teacher' | 'parent' | 'guidance_counselor' | 'staff';
  menuCategories?: MenuCategory[];
  panelTitle?: string;
}

const getDefaultAdminMenuCategories = (t: (key: string) => string): MenuCategory[] => [
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
  {
    id: 'student_management',
    label: t('menu.studentManagement'),
    items: [
      { id: 'children', label: t('menu.children'), icon: Baby },
      { id: 'users', label: t('menu.users'), icon: Users },
      { id: 'attendance', label: t('menu.attendance'), icon: Calendar },
    ],
  },
  {
    id: 'reports',
    label: t('menu.reports'),
    items: [
      { id: 'montessori_reports', label: t('menu.montessoriReports'), icon: Sparkles },
      { id: 'branch_reports', label: t('menu.branchReports'), icon: BookOpen },
      { id: 'teacher_assignments', label: t('menu.teacherAssignments'), icon: UserCheck },
      { id: 'behavior_incidents', label: t('menu.behaviorIncidents'), icon: AlertTriangle },
    ],
  },
  {
    id: 'communication',
    label: t('menu.communication'),
    items: [
      { id: 'announcements', label: t('menu.announcements'), icon: Megaphone },
      { id: 'messages', label: t('menu.messages'), icon: MessageSquare },
      { id: 'calendar', label: t('menu.calendar'), icon: Calendar },
    ],
  },
  {
    id: 'finance',
    label: t('menu.finance'),
    items: [
      { id: 'fees', label: t('menu.fees'), icon: CreditCard },
      { id: 'appointments', label: t('menu.appointments'), icon: CalendarCheck },
    ],
  },
  {
    id: 'operations',
    label: t('menu.operations'),
    items: [
      { id: 'tasks', label: t('menu.tasks'), icon: ClipboardList },
      { id: 'menu', label: t('menu.menu'), icon: UtensilsCrossed },
      { id: 'duty', label: t('menu.duty'), icon: UserCheck },
    ],
  },
  {
    id: 'services',
    label: t('menu.services'),
    items: [
      { id: 'services', label: t('menu.servicesTracking'), icon: Car },
      { id: 'cleaning', label: t('menu.cleaning'), icon: Sparkles },
      { id: 'material_requests', label: t('menu.materialRequests'), icon: Package },
      { id: 'inquiries', label: t('menu.inquiries'), icon: Bell },
    ],
  },
  {
    id: 'content',
    label: t('menu.content'),
    items: [
      { id: 'content_management', label: t('menu.contentManagement'), icon: Edit },
      { id: 'ref_management', label: t('menu.refManagement'), icon: Edit },
    ],
  },
  {
    id: 'settings',
    label: t('menu.settings'),
    items: [
      { id: 'settings_management', label: t('menu.instagramSettings'), icon: Settings },
      { id: 'video_settings', label: t('menu.videoSettings'), icon: Video },
    ],
  },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onSignOut,
  userFullName,
  pendingUsersCount = 0,
  userRole = 'admin',
  menuCategories,
  panelTitle,
}: SidebarProps) {
  const { t } = useLanguage();
  const categories = menuCategories || getDefaultAdminMenuCategories(t);
  const title = panelTitle || t('sidebar.adminPanel');

  const STORAGE_VERSION = '1.0';

  const [isCollapsed, setIsCollapsed] = useState(() => {
    const version = localStorage.getItem('sidebar-version');
    if (version !== STORAGE_VERSION) {
      localStorage.removeItem('sidebar-collapsed');
      localStorage.removeItem('sidebar-expanded-categories');
      localStorage.setItem('sidebar-version', STORAGE_VERSION);
    }

    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(() => {
    const version = localStorage.getItem('sidebar-version');
    if (version !== STORAGE_VERSION) {
      localStorage.removeItem('sidebar-expanded-categories');
      localStorage.setItem('sidebar-version', STORAGE_VERSION);
    }

    const saved = localStorage.getItem('sidebar-expanded-categories');
    let initialCategories: string[] = ['homepage'];

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        initialCategories = Array.isArray(parsed) ? parsed : ['homepage'];
      } catch (e) {
        initialCategories = ['homepage'];
      }
    } else {
      const activeCategory = categories.find(cat =>
        cat.items.some(item => item.id === activeTab)
      );
      if (activeCategory && activeCategory.id !== 'homepage') {
        initialCategories.push(activeCategory.id);
      }
    }

    if (!initialCategories.includes('homepage')) {
      initialCategories.unshift('homepage');
    }

    return initialCategories;
  });

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const categoriesToSave = expandedCategories.includes('homepage')
      ? expandedCategories
      : ['homepage', ...expandedCategories];
    localStorage.setItem('sidebar-expanded-categories', JSON.stringify(categoriesToSave));
  }, [expandedCategories]);

  useEffect(() => {
    const activeCategory = categories.find(cat =>
      cat.items.some(item => item.id === activeTab)
    );
    if (activeCategory && !expandedCategories.includes(activeCategory.id)) {
      setExpandedCategories(prev => {
        const newCategories = [...prev, activeCategory.id];
        if (!newCategories.includes('homepage')) {
          newCategories.unshift('homepage');
        }
        return newCategories;
      });
    }
  }, [activeTab]);

  const toggleCategory = (categoryId: string) => {
    if (categoryId === 'homepage') {
      return;
    }
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return ['homepage', categoryId];
      }
    });
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
              <h1 className="text-lg font-bold text-white">{title}</h1>
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
        {categories.map((category) => {
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
          <>
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-2 px-3">{t('sidebar.followUs')}</p>
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
          </>
        )}

        {isCollapsed && (
          <>
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
          </>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex w-full items-center justify-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          title={isCollapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          <ChevronLeft
            className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
          />
          {!isCollapsed && <span>{t('sidebar.collapse')}</span>}
        </button>
        <button
          onClick={onSignOut}
          className={`w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? t('sidebar.logout') : ''}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>{t('sidebar.logout')}</span>}
        </button>
      </div>
    </div>
  );

  const capitalizeWords = (text: string) => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all"
      >
        <img
          src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
          alt="REF Logo"
          className="w-10 h-10 object-contain"
        />
      </button>

      {userFullName && (
        <div className="lg:hidden fixed top-4 right-4 z-40 flex items-center space-x-2 bg-emerald-50/95 backdrop-blur-sm shadow-lg rounded-lg px-3 py-2.5">
          <div className="flex items-center space-x-1.5">
            <User className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-medium text-emerald-900">{capitalizeWords(userFullName)}</span>
          </div>
          <button
            onClick={onSignOut}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-md transition-colors"
            title="Çıkış Yap"
          >
            <LogOut className="w-3 h-3" />
            <span className="text-xs">Çıkış</span>
          </button>
        </div>
      )}

      <a
        href="https://wa.me/905315504454"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-2 lg:right-6 z-40 flex items-center justify-center w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
        title="WhatsApp ile iletişime geç"
      >
        <Phone className="w-7 h-7 group-hover:scale-110 transition-transform" />
      </a>

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
