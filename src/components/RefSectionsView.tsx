import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Package, Palette, Settings, Users, Heart, ClipboardList, User, Home, Search, File as FileEdit, Save, RefreshCw } from 'lucide-react';
import ProductCatalog from './ProductCatalog';
import PlayGroupCalendar from './PlayGroupCalendar';
import CartView from './CartView';
import FavoritesView from './FavoritesView';
import UserOrdersView from './UserOrdersView';
import RefAtolyeAdminPanel from './RefAtolyeAdminPanel';
import RefAtolyeLogin from './RefAtolyeLogin';
import AtolyeAccountProfile from './AtolyeAccountProfile';
import RefAtolyeHomePage from './RefAtolyeHomePage';

interface RefSection {
  id: string;
  section_type: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
  title: string;
  content: string;
  media_urls: string[];
  display_order: number;
  created_at: string;
}

interface RefSectionsViewProps {
  sectionType: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
  isAtolyeUser?: boolean;
}

const SECTION_LABELS = {
  ref_akademi: 'Ref Akademi',
  ref_danismanlik: 'Ref Danışmanlık',
  ref_atolye: 'Ref Atölye',
};

type RefAtolyeTab = 'home' | 'products' | 'courses' | 'play_groups' | 'cart' | 'favorites' | 'orders' | 'admin' | 'account';
type RefDanismanlikTab = 'content' | 'applications' | 'form_settings';

export default function RefSectionsView({ sectionType, isAtolyeUser = false }: RefSectionsViewProps) {
  const { profile } = useAuth();
  const [sections, setSections] = useState<RefSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RefAtolyeTab | RefDanismanlikTab>(
    sectionType === 'ref_atolye' ? 'home' : 'content'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [referenceApplications, setReferenceApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [showAtolyeLogin, setShowAtolyeLogin] = useState(false);
  const [formSettings, setFormSettings] = useState({ deadline: '', requirements: '' });
  const [formSettingsSaving, setFormSettingsSaving] = useState(false);
  const [formSettingsSaved, setFormSettingsSaved] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const showDanismanlikTabs = sectionType === 'ref_danismanlik' && isAdmin;
  const showAtolyeTabs = sectionType === 'ref_atolye';

  useEffect(() => {
    loadSection();
    if (sectionType === 'ref_danismanlik' && isAdmin) {
      loadReferenceApplications();
      loadFormSettings();
    }
  }, [sectionType]);

  useEffect(() => {
    const handleNavigateToCart = () => {
      setActiveTab('cart');
    };

    const handleNavigateToAccount = () => {
      setActiveTab('account');
    };

    window.addEventListener('navigate-to-cart', handleNavigateToCart);
    window.addEventListener('navigate-to-account', handleNavigateToAccount);

    return () => {
      window.removeEventListener('navigate-to-cart', handleNavigateToCart);
      window.removeEventListener('navigate-to-account', handleNavigateToAccount);
    };
  }, []);

  const loadSection = async () => {
    try {
      const { data, error } = await supabase
        .from('ref_sections')
        .select('*')
        .eq('section_type', sectionType)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading ref section:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceApplications = async () => {
    try {
      const { data } = await supabase
        .from('reference_teacher_applications')
        .select('*')
        .order('created_at', { ascending: false });
      setReferenceApplications(data || []);
    } catch (error) {
      console.error('Error loading reference applications:', error);
    }
  };

  const loadFormSettings = async () => {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['ref_form_deadline', 'ref_form_requirements']);
      if (data) {
        const deadline = data.find((r: any) => r.key === 'ref_form_deadline')?.value || '23 OCAK';
        const requirements = data.find((r: any) => r.key === 'ref_form_requirements')?.value || '';
        setFormSettings({ deadline, requirements });
      }
    } catch (error) {
      console.error('Error loading form settings:', error);
    }
  };

  const saveFormSettings = async () => {
    setFormSettingsSaving(true);
    setFormSettingsSaved(false);
    try {
      await supabase
        .from('app_settings')
        .upsert([
          { key: 'ref_form_deadline', value: formSettings.deadline, description: 'Referans Öğretmen Programı son başvuru tarihi' },
          { key: 'ref_form_requirements', value: formSettings.requirements, description: 'Referans Öğretmen Programı başvuru şartları metni' },
        ], { onConflict: 'key' });
      setFormSettingsSaved(true);
      setTimeout(() => setFormSettingsSaved(false), 3000);
    } catch (error) {
      console.error('Error saving form settings:', error);
    } finally {
      setFormSettingsSaving(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('reference_teacher_applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;
      loadReferenceApplications();
      setSelectedApplication(null);
      alert('Başvuru durumu güncellendi');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleTabChange = (tab: RefAtolyeTab | RefDanismanlikTab, categoryId?: string) => {
    setActiveTab(tab);
    if (categoryId) {
      setSelectedCategoryId(categoryId);
    }
  };

  const handleGlobalSearch = async (query: string) => {
    const lowerQuery = query.toLowerCase();

    try {
      const { data: products } = await supabase
        .from('products')
        .select('name, category_id')
        .ilike('name', `%${query}%`)
        .limit(1);

      const { data: playGroups } = await supabase
        .from('play_group_sessions')
        .select('title, theme')
        .or(`title.ilike.%${query}%,theme.ilike.%${query}%`)
        .limit(1);

      if (products && products.length > 0) {
        setActiveTab('products');
        if (products[0].category_id) {
          setSelectedCategoryId(products[0].category_id);
        }
      } else if (playGroups && playGroups.length > 0) {
        setActiveTab('play_groups');
      } else {
        alert(`"${query}" için sonuç bulunamadı`);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const getTabLabel = (tab: RefAtolyeTab | RefDanismanlikTab) => {
    const labels = {
      home: 'Ana Sayfa',
      products: 'Ürünler',
      courses: 'Atölyeler',
      play_groups: 'Oyun Grupları',
      cart: 'Sepetim',
      favorites: 'Favorilerim',
      orders: 'Siparişlerim',
      admin: 'Yönetim',
      account: 'Hesabım',
      content: 'İçerik',
      applications: 'Referans Öğretmen Başvuruları',
      form_settings: 'Form Ayarları',
    };
    return labels[tab] || tab;
  };

  if (showAtolyeLogin) {
    return (
      <RefAtolyeLogin
        onBack={() => setShowAtolyeLogin(false)}
        onLoginSuccess={() => {
          setShowAtolyeLogin(false);
          window.location.reload();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 md:p-8">
      {/* Ref Danışmanlık Tabs */}
      {showDanismanlikTabs && (
        <>
          {/* Mobile Card Menu */}
          <div className="md:hidden grid grid-cols-3 gap-3 mb-6 mt-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all ${
                activeTab === 'content'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-7 h-7 mb-2" />
              <span className="text-xs font-medium text-center">İçerik</span>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all relative ${
                activeTab === 'applications'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ClipboardList className="w-7 h-7 mb-2" />
              <span className="text-xs font-medium text-center">Başvurular</span>
              {referenceApplications.length > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {referenceApplications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('form_settings')}
              className={`flex flex-col items-center justify-center p-5 rounded-xl transition-all ${
                activeTab === 'form_settings'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileEdit className="w-7 h-7 mb-2" />
              <span className="text-xs font-medium text-center">Form Ayarları</span>
            </button>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:block border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('content')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'content'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                İçerik
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'applications'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Referans Öğretmen Başvuruları
                {referenceApplications.length > 0 && (
                  <span className="ml-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                    {referenceApplications.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('form_settings')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'form_settings'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileEdit className="w-4 h-4" />
                Form Ayarları
              </button>
            </div>
          </div>
        </>
      )}

      {/* Ref Atölye Tabs */}
      {showAtolyeTabs && (
        <>
          {/* Mobile View */}
          <div className="md:hidden mt-16">
            {/* Home Page: Search Bar + Grid Cards */}
            {activeTab === 'home' && (
              <>
                {/* Global Search Bar */}
                <div className="mb-6 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="text"
                    placeholder="Ürün, oyun grubu, atölye ara..."
                    value={searchQuery}
                    onChange={(e) => {
                      const query = e.target.value;
                      setSearchQuery(query);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        handleGlobalSearch(searchQuery);
                      }
                    }}
                    className="w-full pl-12 pr-12 py-3 bg-white border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                  />
                  {searchQuery.trim() && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 text-xl"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Grid Cards - All Same Size */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setActiveTab('products')}
                    className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
                  >
                    <ShoppingCart className="w-7 h-7 mb-2 text-emerald-600" />
                    <span className="text-sm font-semibold">Ürünler</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
                  >
                    <Palette className="w-7 h-7 mb-2 text-emerald-600" />
                    <span className="text-sm font-semibold">Atölyeler</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('play_groups')}
                    className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
                  >
                    <Users className="w-7 h-7 mb-2 text-emerald-600" />
                    <span className="text-sm font-semibold">Oyun Grupları</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('cart')}
                    className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
                  >
                    <ShoppingCart className="w-7 h-7 mb-2 text-emerald-600" />
                    <span className="text-sm font-semibold">Sepetim</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('favorites')}
                    className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
                  >
                    <Heart className="w-7 h-7 mb-2 text-emerald-600" />
                    <span className="text-sm font-semibold">Favorilerim</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
                  >
                    <Package className="w-7 h-7 mb-2 text-emerald-600" />
                    <span className="text-sm font-semibold">Siparişlerim</span>
                  </button>
                  {!isAtolyeUser && (
                    <button
                      onClick={() => setShowAtolyeLogin(true)}
                      className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300 text-emerald-700 rounded-xl hover:shadow-lg transition-all"
                    >
                      <User className="w-7 h-7 mb-2" />
                      <span className="text-sm font-semibold">Hesabım</span>
                    </button>
                  )}
                  {isAtolyeUser && (
                    <button
                      onClick={() => setActiveTab('account')}
                      className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-100 to-teal-100 border-2 border-emerald-300 text-emerald-700 rounded-xl hover:shadow-lg transition-all"
                    >
                      <User className="w-7 h-7 mb-2" />
                      <span className="text-sm font-semibold">Hesabım</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setActiveTab('admin')}
                      className="flex flex-col items-center justify-center p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-gray-700 rounded-xl hover:shadow-lg transition-all"
                    >
                      <Settings className="w-7 h-7 mb-2 text-emerald-600" />
                      <span className="text-sm font-semibold">Yönetim</span>
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Other Pages: Mini Grid Cards at Top → Content Below */}
            {activeTab !== 'home' && (
              <>
                {/* Mini Grid Cards - Single Row */}
                <div className="mb-4 overflow-x-auto pb-2">
                  <div className="flex gap-2 min-w-max">
                    <button
                      onClick={() => setActiveTab('home')}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                    >
                      <Home className="w-5 h-5 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Ana Sayfa</span>
                    </button>
                    {activeTab !== 'products' && (
                      <button
                        onClick={() => setActiveTab('products')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Ürünler</span>
                      </button>
                    )}
                    {activeTab !== 'courses' && (
                      <button
                        onClick={() => setActiveTab('courses')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <Palette className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Atölyeler</span>
                      </button>
                    )}
                    {activeTab !== 'play_groups' && (
                      <button
                        onClick={() => setActiveTab('play_groups')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <Users className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Oyun Grupları</span>
                      </button>
                    )}
                    {activeTab !== 'cart' && (
                      <button
                        onClick={() => setActiveTab('cart')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <ShoppingCart className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Sepetim</span>
                      </button>
                    )}
                    {activeTab !== 'favorites' && (
                      <button
                        onClick={() => setActiveTab('favorites')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <Heart className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Favorilerim</span>
                      </button>
                    )}
                    {activeTab !== 'orders' && (
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <Package className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Siparişlerim</span>
                      </button>
                    )}
                    {activeTab !== 'account' && isAtolyeUser && (
                      <button
                        onClick={() => setActiveTab('account')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <User className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Hesabım</span>
                      </button>
                    )}
                    {activeTab !== 'account' && !isAtolyeUser && (
                      <button
                        onClick={() => setShowAtolyeLogin(true)}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-50 border-2 border-emerald-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <User className="w-5 h-5 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-700">Hesabım</span>
                      </button>
                    )}
                    {activeTab !== 'admin' && isAdmin && (
                      <button
                        onClick={() => setActiveTab('admin')}
                        className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-all"
                      >
                        <Settings className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Yönetim</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Selected Tab Header */}
                <div className="mb-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-5 shadow-xl border-2 border-emerald-400">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                      {activeTab === 'products' && <ShoppingCart className="w-6 h-6" />}
                      {activeTab === 'courses' && <Palette className="w-6 h-6" />}
                      {activeTab === 'play_groups' && <Users className="w-6 h-6" />}
                      {activeTab === 'cart' && <ShoppingCart className="w-6 h-6" />}
                      {activeTab === 'favorites' && <Heart className="w-6 h-6" />}
                      {activeTab === 'orders' && <Package className="w-6 h-6" />}
                      {activeTab === 'account' && <User className="w-6 h-6" />}
                      {activeTab === 'admin' && <Settings className="w-6 h-6" />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{getTabLabel(activeTab)}</h2>
                      <p className="text-emerald-100 text-xs">İçeriği görüntüle</p>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="mb-6 animate-fadeIn">
                  {activeTab === 'products' && (
                    <div className="bg-white rounded-xl shadow-lg p-4 border-2 border-emerald-100">
                      <ProductCatalog initialCategoryId={selectedCategoryId} />
                    </div>
                  )}
                  {activeTab === 'courses' && (
                    <div className="bg-white rounded-xl shadow-lg p-8 text-center border-2 border-emerald-100">
                      <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">Atölyeler</h3>
                      <p className="text-gray-500">Eğitim atölyeleri yakında burada olacak.</p>
                    </div>
                  )}
                  {activeTab === 'play_groups' && (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100">
                      <PlayGroupCalendar />
                    </div>
                  )}
                  {activeTab === 'cart' && (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100">
                      <CartView />
                    </div>
                  )}
                  {activeTab === 'favorites' && (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100">
                      <FavoritesView />
                    </div>
                  )}
                  {activeTab === 'orders' && (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100">
                      <UserOrdersView />
                    </div>
                  )}
                  {activeTab === 'account' && isAtolyeUser && (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100">
                      <AtolyeAccountProfile />
                    </div>
                  )}
                  {activeTab === 'admin' && isAdmin && (
                    <div className="bg-white rounded-xl shadow-lg border-2 border-emerald-100">
                      <RefAtolyeAdminPanel />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:block border-b border-gray-200 mb-6 mt-8">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab('home')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'home'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Home className="w-4 h-4" />
                Ana Sayfa
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'products'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Ürünler
              </button>
              <button
                onClick={() => setActiveTab('courses')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'courses'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Palette className="w-4 h-4" />
                Atölyeler
              </button>
              <button
                onClick={() => setActiveTab('play_groups')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'play_groups'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4" />
                Oyun Grupları
              </button>
              <button
                onClick={() => setActiveTab('cart')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'cart'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Sepetim
              </button>
              <button
                onClick={() => setActiveTab('favorites')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'favorites'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Heart className="w-4 h-4" />
                Favorilerim
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'orders'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4" />
                Siparişlerim
              </button>
              {!isAtolyeUser && (
                <button
                  onClick={() => setShowAtolyeLogin(true)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === 'account'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-emerald-500 hover:text-emerald-700 hover:border-emerald-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Hesabım
                </button>
              )}
              {isAtolyeUser && (
                <button
                  onClick={() => setActiveTab('account')}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === 'account'
                      ? 'border-emerald-600 text-emerald-600'
                      : 'border-transparent text-emerald-500 hover:text-emerald-700 hover:border-emerald-300'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Hesabım
                </button>
              )}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                      activeTab === 'admin'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    Yönetim
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Ref Atölye - Home Tab - Only shown on Desktop or when home is active on mobile */}
      {activeTab === 'home' && sectionType === 'ref_atolye' && (
        <div className="md:block">
          <RefAtolyeHomePage onNavigate={handleTabChange} />
        </div>
      )}

      {/* Desktop Content Sections - Hidden on Mobile */}
      {activeTab === 'products' && sectionType === 'ref_atolye' && (
        <div className="hidden md:block">
          <ProductCatalog initialCategoryId={selectedCategoryId} />
        </div>
      )}

      {activeTab === 'courses' && sectionType === 'ref_atolye' && (
        <div className="hidden md:block">
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Atölyeler</h3>
            <p className="text-gray-500">Eğitim atölyeleri yakında burada olacak.</p>
          </div>
        </div>
      )}

      {activeTab === 'play_groups' && sectionType === 'ref_atolye' && (
        <div className="hidden md:block">
          <PlayGroupCalendar />
        </div>
      )}

      {activeTab === 'cart' && sectionType === 'ref_atolye' && (
        <div className="hidden md:block">
          <CartView />
        </div>
      )}

      {activeTab === 'favorites' && sectionType === 'ref_atolye' && (
        <div className="hidden md:block">
          <FavoritesView />
        </div>
      )}

      {activeTab === 'orders' && sectionType === 'ref_atolye' && (
        <div className="hidden md:block">
          <UserOrdersView />
        </div>
      )}

      {activeTab === 'admin' && sectionType === 'ref_atolye' && isAdmin && (
        <div className="hidden md:block">
          <RefAtolyeAdminPanel />
        </div>
      )}

      {activeTab === 'account' && sectionType === 'ref_atolye' && isAtolyeUser && (
        <div className="hidden md:block">
          <AtolyeAccountProfile />
        </div>
      )}

      {activeTab === 'content' && sectionType !== 'ref_atolye' && (
        <>
          {sections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Bu bölüm için henüz içerik eklenmemiş.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {sections.map((section, index) => (
                <div key={section.id} className={index > 0 ? 'border-t border-gray-200 pt-8' : ''}>
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">
                    {section.title}
                  </h3>

                  <div className="prose max-w-none">
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                      {section.content}
                    </p>
                  </div>

                  {section.media_urls && section.media_urls.length > 0 && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.media_urls.map((url, idx) => (
                        <div key={idx} className="rounded-lg overflow-hidden shadow-sm">
                          <img
                            src={url}
                            alt={`${section.title} - ${idx + 1}`}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}


      {activeTab === 'applications' && showDanismanlikTabs && (
        <div>
          <div className="mb-6">
            <p className="text-gray-600">Son başvuru tarihi: 23 Ocak</p>
          </div>

          {referenceApplications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Henüz başvuru yok</div>
          ) : (
            <div className="grid gap-4">
              {referenceApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex space-x-4">
                      {app.photo_url && (
                        <img
                          src={app.photo_url}
                          alt={app.full_name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{app.full_name}</h3>
                        <p className="text-sm text-gray-600">{app.email}</p>
                        <p className="text-sm text-gray-600">{app.phone}</p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                            app.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : app.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {app.status === 'approved'
                            ? 'Onaylandı'
                            : app.status === 'rejected'
                            ? 'Reddedildi'
                            : 'Beklemede'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedApplication(app)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Detayları Gör
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'form_settings' && showDanismanlikTabs && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <FileEdit className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Başvuru Formu Ayarları</h3>
              <p className="text-sm text-gray-500">Referans Öğretmen Programı formunun içeriğini düzenleyin</p>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
            Bu ayarlar, kamuya açık başvuru formunun başlık bölümünde görüntülenir. Değişiklikler anında yansır.
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Son Başvuru Tarihi
              </label>
              <input
                type="text"
                value={formSettings.deadline}
                onChange={(e) => setFormSettings({ ...formSettings, deadline: e.target.value })}
                placeholder="Örn: 23 OCAK"
                className="w-full md:w-80 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800"
              />
              <p className="text-xs text-gray-500 mt-1">Formda "SON BAŞVURU TARİHİ: ..." şeklinde gösterilir</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Başvuru Şartları
              </label>
              <textarea
                value={formSettings.requirements}
                onChange={(e) => setFormSettings({ ...formSettings, requirements: e.target.value })}
                rows={4}
                placeholder="Başvuru şartlarını buraya yazın..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-800 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">Formun üst kısmında bilgilendirme metni olarak gösterilir</p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={saveFormSettings}
                disabled={formSettingsSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formSettingsSaving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {formSettingsSaving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              {formSettingsSaved && (
                <span className="text-sm text-emerald-700 font-medium">Ayarlar kaydedildi.</span>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Canlı Önizleme</h4>
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 rounded-xl max-w-2xl">
              <p className="font-semibold text-white text-base mb-2">
                SON BAŞVURU TARİHİ: {formSettings.deadline || '—'}
              </p>
              <p className="text-white/90 text-sm font-medium">
                {formSettings.requirements || '—'}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Başvuru Detayları</h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {selectedApplication.photo_url && (
                <div className="flex justify-center">
                  <img
                    src={selectedApplication.photo_url}
                    alt={selectedApplication.full_name}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
                  <p className="text-gray-900">{selectedApplication.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <p className="text-gray-900">{selectedApplication.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <p className="text-gray-900">{selectedApplication.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
                  <p className="text-gray-900">{selectedApplication.age}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim Seviyesi</label>
                  <p className="text-gray-900">{selectedApplication.education_level}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montessori Sertifikası</label>
                  <p className="text-gray-900">{selectedApplication.has_montessori_certificate ? 'Var' : 'Yok'}</p>
                </div>
              </div>

              {selectedApplication.work_experience && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">İş Deneyimi</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedApplication.work_experience}</p>
                </div>
              )}

              {selectedApplication.why_ref && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Neden REF?</label>
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedApplication.why_ref}</p>
                </div>
              )}

              {selectedApplication.status === 'pending' && (
                <div className="flex space-x-4 pt-4 border-t">
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'approved')}
                    className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedApplication.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Reddet
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
