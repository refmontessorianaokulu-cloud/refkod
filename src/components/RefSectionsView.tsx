import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Package, Palette, Settings, Users, Calendar as CalendarIcon, Heart, ClipboardList, User, Home } from 'lucide-react';
import ProductCatalog from './ProductCatalog';
import PlayGroupCalendar from './PlayGroupCalendar';
import CartView from './CartView';
import FavoritesView from './FavoritesView';
import UserOrdersView from './UserOrdersView';
import RefAtolyeAdminPanel from './RefAtolyeAdminPanel';
import RefAtolyeLogin from './RefAtolyeLogin';
import AtolyeAccountProfile from './AtolyeAccountProfile';
import RefAtolyeHomePage from './RefAtolyeHomePage';
import TypewriterSearch from './TypewriterSearch';

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
type RefDanismanlikTab = 'content' | 'applications';

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

  const isAdmin = profile?.role === 'admin';
  const showDanismanlikTabs = sectionType === 'ref_danismanlik' && isAdmin;
  const showAtolyeTabs = sectionType === 'ref_atolye';

  useEffect(() => {
    loadSection();
    if (sectionType === 'ref_danismanlik' && isAdmin) {
      loadReferenceApplications();
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
    };
    return labels[tab] || tab;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('products');
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
      {/* Mobil Arama Kutusu - Sadece Ref Atölye için */}
      {showAtolyeTabs && (
        <div className="md:hidden mb-6 pt-20">
          <TypewriterSearch onSearch={handleSearch} />
        </div>
      )}

      {/* Ref Danışmanlık Tabs */}
      {showDanismanlikTabs && (
        <>
          {/* Mobile Card Menu */}
          <div className="md:hidden grid grid-cols-2 gap-3 mb-6 mt-6">
            <button
              onClick={() => setActiveTab('content')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'content'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">İçerik</span>
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all relative ${
                activeTab === 'applications'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ClipboardList className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Başvurular</span>
              {referenceApplications.length > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {referenceApplications.length}
                </span>
              )}
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
            </div>
          </div>
        </>
      )}

      {/* Ref Atölye Tabs */}
      {showAtolyeTabs && (
        <>
          {/* Mobile Card Menu */}
          <div className="md:hidden grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'home'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Home className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Ana Sayfa</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Ürünler</span>
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'courses'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Palette className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Atölyeler</span>
            </button>
            <button
              onClick={() => setActiveTab('play_groups')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'play_groups'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Users className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Oyun Grupları</span>
            </button>
            <button
              onClick={() => setActiveTab('cart')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'cart'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Sepetim</span>
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'favorites'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Heart className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Favorilerim</span>
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                activeTab === 'orders'
                  ? 'bg-emerald-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Package className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium text-center">Siparişlerim</span>
            </button>
            {!isAtolyeUser && (
              <button
                onClick={() => setShowAtolyeLogin(true)}
                className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                  activeTab === 'account'
                    ? 'bg-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <User className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium text-center">Hesabım</span>
              </button>
            )}
            {isAtolyeUser && (
              <button
                onClick={() => setActiveTab('account')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                  activeTab === 'account'
                    ? 'bg-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <User className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium text-center">Hesabım</span>
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex flex-col items-center justify-center p-6 rounded-xl transition-all ${
                  activeTab === 'admin'
                    ? 'bg-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium text-center">Yönetim</span>
              </button>
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

      {/* Ref Atölye - Home Tab */}
      {activeTab === 'home' && sectionType === 'ref_atolye' && (
        <div>
          <RefAtolyeHomePage onNavigate={handleTabChange} />
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

      {/* Ref Atölye - Products Tab */}
      {activeTab === 'products' && sectionType === 'ref_atolye' && (
        <div>
          <ProductCatalog initialCategoryId={selectedCategoryId} />
        </div>
      )}

      {/* Ref Atölye - Courses Tab */}
      {activeTab === 'courses' && sectionType === 'ref_atolye' && (
        <div>
          <div className="text-center py-12">
            <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Atölyeler</h3>
            <p className="text-gray-500">Eğitim atölyeleri yakında burada olacak.</p>
          </div>
        </div>
      )}

      {/* Ref Atölye - Play Groups Tab */}
      {activeTab === 'play_groups' && sectionType === 'ref_atolye' && (
        <div>
          <PlayGroupCalendar />
        </div>
      )}

      {/* Ref Atölye - Cart Tab */}
      {activeTab === 'cart' && sectionType === 'ref_atolye' && (
        <div>
          <CartView />
        </div>
      )}

      {/* Ref Atölye - Favorites Tab */}
      {activeTab === 'favorites' && sectionType === 'ref_atolye' && (
        <div>
          <FavoritesView />
        </div>
      )}

      {/* Ref Atölye - Orders Tab */}
      {activeTab === 'orders' && sectionType === 'ref_atolye' && (
        <div>
          <UserOrdersView />
        </div>
      )}

      {/* Ref Atölye - Admin Tab */}
      {activeTab === 'admin' && sectionType === 'ref_atolye' && isAdmin && (
        <RefAtolyeAdminPanel />
      )}

      {/* Ref Atölye - Account Tab */}
      {activeTab === 'account' && sectionType === 'ref_atolye' && isAtolyeUser && (
        <AtolyeAccountProfile />
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
