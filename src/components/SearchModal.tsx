import { useState, useEffect, useRef } from 'react';
import { X, Search, Clock, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { MenuTab } from './Sidebar';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: string;
  action: () => void;
  icon?: string;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (tab: MenuTab) => void;
  userRole?: 'admin' | 'teacher' | 'parent' | 'guidance_counselor' | 'staff' | 'guest';
}

export default function SearchModal({ isOpen, onClose, onNavigate, userRole = 'guest' }: SearchModalProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      loadRecentSearches();
    } else {
      setSearchQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const delayDebounce = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);

      return () => clearTimeout(delayDebounce);
    } else {
      setResults([]);
    }
  }, [searchQuery, userRole]);

  const loadRecentSearches = () => {
    const saved = localStorage.getItem('recent-searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  };

  const saveRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    const menuItems = getMenuItemsForRole(userRole);
    menuItems.forEach(item => {
      if (item.label.toLowerCase().includes(normalizedQuery) ||
          item.keywords?.some(k => k.toLowerCase().includes(normalizedQuery))) {
        results.push({
          id: item.id,
          title: item.label,
          description: item.description || '',
          category: t('search.categories'),
          action: () => {
            if (onNavigate) {
              onNavigate(item.id as MenuTab);
            }
            saveRecentSearch(query);
            onClose();
          },
        });
      }
    });

    if (userRole === 'admin' || userRole === 'teacher' || userRole === 'parent') {
      try {
        const { data: children } = await supabase
          .from('children')
          .select('id, first_name, last_name, class_name')
          .ilike('first_name', `%${normalizedQuery}%`);

        if (children) {
          children.forEach(child => {
            results.push({
              id: child.id,
              title: `${child.first_name} ${child.last_name}`,
              description: child.class_name || '',
              category: t('menu.children'),
              action: () => {
                if (onNavigate) {
                  onNavigate('children');
                }
                saveRecentSearch(query);
                onClose();
              },
            });
          });
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }

    if (userRole === 'admin' || userRole === 'teacher') {
      try {
        const { data: announcements } = await supabase
          .from('announcements')
          .select('id, title')
          .ilike('title', `%${normalizedQuery}%`)
          .limit(5);

        if (announcements) {
          announcements.forEach(announcement => {
            results.push({
              id: announcement.id,
              title: announcement.title,
              description: '',
              category: t('menu.announcements'),
              action: () => {
                if (onNavigate) {
                  onNavigate('announcements');
                }
                saveRecentSearch(query);
                onClose();
              },
            });
          });
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }

    setResults(results);
    setIsSearching(false);
  };

  const getMenuItemsForRole = (role: string) => {
    const baseItems = [
      { id: 'home', label: t('menu.home'), description: '', keywords: ['ana', 'home', 'anasayfa'] },
      { id: 'about', label: t('menu.about'), description: '', keywords: ['hakkımızda', 'about', 'hakkimizda'] },
    ];

    if (role === 'guest') {
      return [
        ...baseItems,
        { id: 'ref_akademi', label: t('menu.refAkademi'), description: '', keywords: ['ref', 'akademi', 'academy'] },
        { id: 'ref_danismanlik', label: t('menu.refDanismanlik'), description: '', keywords: ['ref', 'danışmanlık', 'danismanlik', 'consulting'] },
        { id: 'ref_atolye', label: t('menu.refAtolye'), description: '', keywords: ['ref', 'atölye', 'atolye', 'workshop'] },
      ];
    }

    if (role === 'admin') {
      return [
        ...baseItems,
        { id: 'children', label: t('menu.children'), description: '', keywords: ['çocuk', 'cocuk', 'children', 'öğrenci', 'ogrenci'] },
        { id: 'users', label: t('menu.users'), description: '', keywords: ['kullanıcı', 'kullanici', 'users', 'veli', 'öğretmen'] },
        { id: 'attendance', label: t('menu.attendance'), description: '', keywords: ['devamsızlık', 'devamsizlik', 'attendance', 'yoklama'] },
        { id: 'montessori_reports', label: t('menu.montessoriReports'), description: '', keywords: ['montessori', 'rapor', 'report'] },
        { id: 'branch_reports', label: t('menu.branchReports'), description: '', keywords: ['branş', 'brans', 'ders', 'course'] },
        { id: 'teacher_assignments', label: t('menu.teacherAssignments'), description: '', keywords: ['öğretmen', 'ogretmen', 'atama', 'assignment'] },
        { id: 'behavior_incidents', label: t('menu.behaviorIncidents'), description: '', keywords: ['kod', 'davranış', 'davranis', 'behavior'] },
        { id: 'announcements', label: t('menu.announcements'), description: '', keywords: ['duyuru', 'announcement'] },
        { id: 'messages', label: t('menu.messages'), description: '', keywords: ['mesaj', 'message'] },
        { id: 'calendar', label: t('menu.calendar'), description: '', keywords: ['takvim', 'calendar', 'akademik'] },
        { id: 'fees', label: t('menu.fees'), description: '', keywords: ['ödeme', 'odeme', 'fees', 'ücret', 'ucret'] },
        { id: 'appointments', label: t('menu.appointments'), description: '', keywords: ['randevu', 'appointment'] },
        { id: 'tasks', label: t('menu.tasks'), description: '', keywords: ['görev', 'gorev', 'task'] },
        { id: 'menu', label: t('menu.menu'), description: '', keywords: ['yemek', 'menü', 'menu', 'meal'] },
        { id: 'duty', label: t('menu.duty'), description: '', keywords: ['nöbet', 'nobet', 'duty'] },
        { id: 'services', label: t('menu.servicesTracking'), description: '', keywords: ['servis', 'service', 'bus'] },
        { id: 'cleaning', label: t('menu.cleaning'), description: '', keywords: ['temizlik', 'cleaning'] },
        { id: 'material_requests', label: t('menu.materialRequests'), description: '', keywords: ['malzeme', 'material', 'talep', 'request'] },
        { id: 'inquiries', label: t('menu.inquiries'), description: '', keywords: ['bilgi', 'talep', 'inquiry'] },
        { id: 'reference_applications', label: t('menu.referenceApplications'), description: '', keywords: ['referans', 'öğretmen', 'ogretmen', 'başvuru', 'basvuru'] },
        { id: 'content_management', label: t('menu.contentManagement'), description: '', keywords: ['içerik', 'icerik', 'content'] },
        { id: 'ref_management', label: t('menu.refManagement'), description: '', keywords: ['ref', 'ekosistem', 'ecosystem'] },
        { id: 'settings_management', label: t('menu.instagramSettings'), description: '', keywords: ['instagram', 'ayar', 'settings'] },
        { id: 'video_settings', label: t('menu.videoSettings'), description: '', keywords: ['video', 'login', 'ayar', 'settings'] },
      ];
    }

    if (role === 'teacher') {
      return [
        ...baseItems,
        { id: 'children', label: t('menu.children'), description: '', keywords: ['çocuk', 'cocuk', 'children'] },
        { id: 'attendance', label: t('menu.attendance'), description: '', keywords: ['devamsızlık', 'devamsizlik', 'attendance'] },
        { id: 'montessori_reports', label: t('menu.montessoriReports'), description: '', keywords: ['montessori', 'rapor', 'report'] },
        { id: 'branch_reports', label: t('menu.branchReports'), description: '', keywords: ['branş', 'brans', 'ders'] },
        { id: 'behavior_incidents', label: t('menu.behaviorIncidents'), description: '', keywords: ['kod', 'davranış', 'davranis'] },
        { id: 'announcements', label: t('menu.announcements'), description: '', keywords: ['duyuru', 'announcement'] },
        { id: 'messages', label: t('menu.messages'), description: '', keywords: ['mesaj', 'message'] },
        { id: 'calendar', label: t('menu.calendar'), description: '', keywords: ['takvim', 'calendar'] },
        { id: 'menu', label: t('menu.menu'), description: '', keywords: ['yemek', 'menü', 'menu'] },
        { id: 'task_responses', label: t('menu.tasks'), description: '', keywords: ['görev', 'gorev', 'task'] },
      ];
    }

    if (role === 'parent') {
      return [
        ...baseItems,
        { id: 'children', label: t('menu.children'), description: '', keywords: ['çocuk', 'cocuk', 'children'] },
        { id: 'montessori_reports', label: t('menu.montessoriReports'), description: '', keywords: ['montessori', 'rapor', 'report'] },
        { id: 'announcements', label: t('menu.announcements'), description: '', keywords: ['duyuru', 'announcement'] },
        { id: 'messages', label: t('menu.messages'), description: '', keywords: ['mesaj', 'message'] },
        { id: 'calendar', label: t('menu.calendar'), description: '', keywords: ['takvim', 'calendar'] },
        { id: 'fees', label: t('menu.fees'), description: '', keywords: ['ödeme', 'odeme', 'fees'] },
        { id: 'menu', label: t('menu.menu'), description: '', keywords: ['yemek', 'menü', 'menu'] },
      ];
    }

    return baseItems;
  };

  const popularSearches = [
    t('menu.children'),
    t('menu.announcements'),
    t('menu.messages'),
    t('menu.calendar'),
  ];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="flex-1 outline-none text-lg"
          />
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent"></div>
              <p className="mt-2 text-gray-600">{t('search.searching')}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="p-2">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={result.action}
                  className="w-full flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{result.title}</p>
                    {result.description && (
                      <p className="text-sm text-gray-500 truncate">{result.description}</p>
                    )}
                    <p className="text-xs text-emerald-600 mt-1">{result.category}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length > 0 ? (
            <div className="p-8 text-center text-gray-500">
              {t('search.noResults')}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-medium text-gray-700">{t('search.recentSearches')}</h3>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(search)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 px-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-medium text-gray-700">{t('search.popularSearches')}</h3>
                </div>
                <div className="space-y-1">
                  {popularSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setSearchQuery(search)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-600 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
