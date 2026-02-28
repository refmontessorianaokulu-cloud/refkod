import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Package, GraduationCap, Settings, Users, Calendar as CalendarIcon, Heart, ClipboardList, Menu, X } from 'lucide-react';
import ProductManagement from './ProductManagement';
import ProductCatalog from './ProductCatalog';
import PlayGroupManagement from './PlayGroupManagement';
import PlayGroupCalendar from './PlayGroupCalendar';
import CartView from './CartView';
import FavoritesView from './FavoritesView';
import UserOrdersView from './UserOrdersView';
import OrderManagement from './OrderManagement';

interface RefSection {
  id: string;
  section_type: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
  title: string;
  content: string;
  media_urls: string[];
  created_at: string;
}

interface RefSectionsViewProps {
  sectionType: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
}

const SECTION_LABELS = {
  ref_akademi: 'Ref Akademi',
  ref_danismanlik: 'Ref Danışmanlık',
  ref_atolye: 'Ref Atölye',
};

type RefAtolyeTab = 'content' | 'products' | 'courses' | 'play_groups' | 'cart' | 'favorites' | 'orders' | 'admin';
type RefDanismanlikTab = 'content' | 'applications';

export default function RefSectionsView({ sectionType }: RefSectionsViewProps) {
  const { profile } = useAuth();
  const [section, setSection] = useState<RefSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RefAtolyeTab | RefDanismanlikTab>('content');
  const [referenceApplications, setReferenceApplications] = useState<any[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const showDanismanlikTabs = sectionType === 'ref_danismanlik' && isAdmin;
  const showAtolyeTabs = sectionType === 'ref_atolye';

  useEffect(() => {
    loadSection();
    if (sectionType === 'ref_danismanlik' && isAdmin) {
      loadReferenceApplications();
    }
  }, [sectionType]);

  const loadSection = async () => {
    try {
      const { data, error } = await supabase
        .from('ref_sections')
        .select('*')
        .eq('section_type', sectionType)
        .maybeSingle();

      if (error) throw error;
      setSection(data);
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

  const handleTabChange = (tab: RefAtolyeTab | RefDanismanlikTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  const getTabLabel = (tab: RefAtolyeTab | RefDanismanlikTab) => {
    const labels = {
      content: 'İçerik',
      products: 'Ürünler',
      courses: 'Online Kurslar',
      play_groups: 'Oyun Grupları',
      cart: 'Sepetim',
      favorites: 'Favorilerim',
      orders: 'Siparişlerim',
      admin: 'Yönetim',
      applications: 'Referans Öğretmen Başvuruları',
    };
    return labels[tab] || tab;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {SECTION_LABELS[sectionType]}
      </h2>

      {/* Ref Danışmanlık Tabs */}
      {showDanismanlikTabs && (
        <>
          {/* Mobile Header with Hamburger */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {getTabLabel(activeTab)}
              </h3>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menüyü aç"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Slide-in Menu */}
              <div className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Menü</h3>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Menüyü kapat"
                    >
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 overflow-y-auto py-4">
                    <button
                      onClick={() => handleTabChange('content')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'content'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                      <span className="font-medium">İçerik</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('applications')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'applications'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ClipboardList className="w-5 h-5" />
                      <div className="flex-1">
                        <span className="font-medium">Başvurular</span>
                        {referenceApplications.length > 0 && (
                          <span className="ml-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                            {referenceApplications.length}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Ref Atölye Tabs */}
      {showAtolyeTabs && (
        <>
          {/* Mobile Header with Hamburger */}
          <div className="md:hidden mb-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {getTabLabel(activeTab)}
              </h3>
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Menüyü aç"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:block border-b border-gray-200 mb-6">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setActiveTab('content')}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === 'content'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Package className="w-4 h-4" />
                İçerik
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
                <GraduationCap className="w-4 h-4" />
                Online Kurslar
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />

              {/* Slide-in Menu */}
              <div className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 md:hidden transform transition-transform duration-300 ease-in-out">
                <div className="flex flex-col h-full">
                  {/* Menu Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Menü</h3>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      aria-label="Menüyü kapat"
                    >
                      <X className="w-6 h-6 text-gray-600" />
                    </button>
                  </div>

                  {/* Menu Items */}
                  <div className="flex-1 overflow-y-auto py-4">
                    <button
                      onClick={() => handleTabChange('content')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'content'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                      <span className="font-medium">İçerik</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('products')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'products'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span className="font-medium">Ürünler</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('courses')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'courses'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5" />
                      <span className="font-medium">Online Kurslar</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('play_groups')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'play_groups'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Users className="w-5 h-5" />
                      <span className="font-medium">Oyun Grupları</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('cart')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'cart'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      <span className="font-medium">Sepetim</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('favorites')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'favorites'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className="w-5 h-5" />
                      <span className="font-medium">Favorilerim</span>
                    </button>
                    <button
                      onClick={() => handleTabChange('orders')}
                      className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                        activeTab === 'orders'
                          ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Package className="w-5 h-5" />
                      <span className="font-medium">Siparişlerim</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleTabChange('admin')}
                        className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                          activeTab === 'admin'
                            ? 'bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Settings className="w-5 h-5" />
                        <span className="font-medium">Yönetim</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'content' && (
        <>
          {!section ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Bu bölüm için henüz içerik eklenmemiş.</p>
            </div>
          ) : (
            <>
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
                  {section.media_urls.map((url, index) => (
                    <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                      <img
                        src={url}
                        alt={`${section.title} - ${index + 1}`}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Ref Atölye - Products Tab */}
      {activeTab === 'products' && sectionType === 'ref_atolye' && (
        <div>
          <ProductCatalog />
        </div>
      )}

      {/* Ref Atölye - Courses Tab */}
      {activeTab === 'courses' && sectionType === 'ref_atolye' && (
        <div>
          <div className="text-center py-12">
            <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Online Kurslar</h3>
            <p className="text-gray-500">Eğitim kursları ve atölyeler yakında burada olacak.</p>
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
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Oyun Grubu Yönetimi
            </h3>
            <PlayGroupManagement />
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Ürün Yönetimi
            </h3>
            <ProductManagement />
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Sipariş Yönetimi
            </h3>
            <OrderManagement />
          </div>
        </div>
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
