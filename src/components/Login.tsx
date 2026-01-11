import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import InquiryForm from './InquiryForm';
import ReferenceTeacherForm from './ReferenceTeacherForm';
import ContactPage from './ContactPage';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search as SearchIcon, Menu, X, Phone, Mail, MapPin, Globe } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import SearchModal from './SearchModal';

interface AboutSection {
  id: string;
  section_key: string;
  section_title: string;
}

interface RefSection {
  id: string;
  section_type: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
  title: string;
  content: string;
  media_urls: string[];
  created_at: string;
}

export default function Login() {
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showReferenceTeacherForm, setShowReferenceTeacherForm] = useState(false);
  const [showContactPage, setShowContactPage] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isLoginCardOpen, setIsLoginCardOpen] = useState(false);
  const [isApplicationCardOpen, setIsApplicationCardOpen] = useState(false);
  const [isAboutCardOpen, setIsAboutCardOpen] = useState(false);
  const [isContactCardOpen, setIsContactCardOpen] = useState(false);
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
  const [aboutLoading, setAboutLoading] = useState(false);
  const [refDanismanlik, setRefDanismanlik] = useState<RefSection | null>(null);
  const [refDanismanlikLoading, setRefDanismanlikLoading] = useState(false);
  const [refAkademi, setRefAkademi] = useState<RefSection | null>(null);
  const [refAkademiLoading, setRefAkademiLoading] = useState(false);
  const [refAtolye, setRefAtolye] = useState<RefSection | null>(null);
  const [refAtolyeLoading, setRefAtolyeLoading] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isRefAkademiCardOpen, setIsRefAkademiCardOpen] = useState(false);
  const [isRefAtolyeCardOpen, setIsRefAtolyeCardOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMenuOpen, setIsDesktopMenuOpen] = useState(false);
  const [openMobileCard, setOpenMobileCard] = useState<string | null>(null);
  const [openDesktopCard, setOpenDesktopCard] = useState<string | null>(null);
  const { signIn, signInAsGuest } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const loadVideoSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('login_video_url, login_video_active, login_video_poster')
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          setVideoUrl(data.login_video_url || '');
          setPosterUrl(data.login_video_poster || '');
          setVideoEnabled(data.login_video_active || false);
        }
      } catch (err) {
        console.log('Video settings not loaded:', err);
      }
    };

    const loadAboutSections = async () => {
      setAboutLoading(true);
      try {
        const { data, error } = await supabase
          .from('about_content')
          .select('id, section_key, section_title')
          .order('display_order', { ascending: true });

        if (!error && data) {
          setAboutSections(data);
        }
      } catch (err) {
        console.log('About sections not loaded:', err);
      } finally {
        setAboutLoading(false);
      }
    };

    const loadRefDanismanlik = async () => {
      setRefDanismanlikLoading(true);
      try {
        const { data, error } = await supabase
          .from('ref_sections')
          .select('*')
          .eq('section_type', 'ref_danismanlik')
          .maybeSingle();

        if (!error && data) {
          setRefDanismanlik(data);
        }
      } catch (err) {
        console.log('Ref danismanlik section not loaded:', err);
      } finally {
        setRefDanismanlikLoading(false);
      }
    };

    const loadRefAkademi = async () => {
      setRefAkademiLoading(true);
      try {
        const { data, error } = await supabase
          .from('ref_sections')
          .select('*')
          .eq('section_type', 'ref_akademi')
          .maybeSingle();

        if (!error && data) {
          setRefAkademi(data);
        }
      } catch (err) {
        console.log('Ref akademi section not loaded:', err);
      } finally {
        setRefAkademiLoading(false);
      }
    };

    const loadRefAtolye = async () => {
      setRefAtolyeLoading(true);
      try {
        const { data, error } = await supabase
          .from('ref_sections')
          .select('*')
          .eq('section_type', 'ref_atolye')
          .maybeSingle();

        if (!error && data) {
          setRefAtolye(data);
        }
      } catch (err) {
        console.log('Ref atolye section not loaded:', err);
      } finally {
        setRefAtolyeLoading(false);
      }
    };

    loadVideoSettings();
    loadAboutSections();
    loadRefDanismanlik();
    loadRefAkademi();
    loadRefAtolye();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      const error = err as any;
      console.error('Login error:', error);
      if (error.message?.includes('onaylanmamış')) {
        setError('Hesabınız henüz yönetici tarafından onaylanmamış. Lütfen onay için bekleyin.');
      } else if (error.message?.includes('Invalid login credentials')) {
        setError('E-posta veya şifre hatalı. Lütfen kontrol edin.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      setResetEmail('');
    } catch (err) {
      setError('Şifre sıfırlama e-postası gönderilemedi. Lütfen e-posta adresinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleAboutSectionClick = (sectionKey: string) => {
    signInAsGuest('about', sectionKey);
  };

  if (showInquiryForm) {
    return <InquiryForm onBack={() => setShowInquiryForm(false)} />;
  }

  if (showReferenceTeacherForm) {
    return <ReferenceTeacherForm />;
  }

  if (showContactPage) {
    return <ContactPage onBack={() => setShowContactPage(false)} />;
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        {videoEnabled && videoUrl ? (
          <>
            <video
              autoPlay
              loop
              muted
              playsInline
              poster={posterUrl || undefined}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50" />
        )}

        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-md transition-all"
            title={t('search.placeholder')}
          >
            <SearchIcon className="w-5 h-5 text-gray-700" />
          </button>
          <LanguageToggle />
        </div>

        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onNavigate={(tab) => {
            signInAsGuest(tab);
          }}
          userRole="guest"
        />

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10">
          <div className="flex items-center justify-center mb-8 mt-4">
            <img
              src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
              alt="REF Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            {t('login.forgotPasswordTitle')}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {t('login.forgotPasswordDesc')}
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <div>
              <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700 mb-2">
                {t('login.email')}
              </label>
              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder={t('login.emailPlaceholder')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? t('login.sending') : t('login.sendResetLink')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              {t('login.backToLogin')}
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex flex-col">
      {videoEnabled && videoUrl ? (
        <>
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={posterUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/30" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50" />
      )}

      {/* Top Header - Mobil ve Masaüstü */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
        {/* Sol Üst İkonlar - Mobilde dikey, Masaüstünde hamburger */}
        <div className="flex flex-col gap-3">
          {/* Hamburger Menü */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(true);
              setIsDesktopMenuOpen(true);
            }}
            className="p-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-md transition-all"
          >
            <Menu className="w-5 h-5 text-gray-700" />
          </button>

          {/* Arama İkonu - Sadece mobilde görünür ve hamburger'ın altında */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="md:hidden p-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-md transition-all"
            title={t('search.placeholder')}
          >
            <SearchIcon className="w-5 h-5 text-gray-700" />
          </button>

          {/* Dil İkonu - Sadece mobilde görünür ve arama'nın altında */}
          <div className="md:hidden">
            <LanguageToggle />
          </div>
        </div>

        {/* Logo - Her durumda ortalı */}
        <div className="absolute left-1/2 -translate-x-1/2 top-3 md:top-px">
          <img
            src="/whatsapp_image_2026-01-10_at_23.02.15.png"
            alt="REF Logo"
            className="w-20 h-20 md:w-40 md:h-40 object-contain cursor-pointer transition-all duration-300 hover:scale-105"
            style={{ mixBlendMode: 'multiply' }}
            onClick={() => {
              const isMobile = window.innerWidth < 768;
              if (isMobile) {
                setIsMobileMenuOpen(true);
                setOpenMobileCard('login');
              } else {
                setIsDesktopMenuOpen(true);
                setOpenDesktopCard('login');
              }
            }}
          />
        </div>

        {/* Sağ Üst İkonlar - Sadece masaüstünde görünür */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-3 bg-white/90 backdrop-blur-sm hover:bg-white rounded-lg shadow-md transition-all"
            title={t('search.placeholder')}
          >
            <SearchIcon className="w-5 h-5 text-gray-700" />
          </button>
          <LanguageToggle />
        </div>
      </div>

      {/* Mobil Hamburger Menü - Sidebar */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <div
          className={`fixed left-0 top-0 bottom-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-sm font-bold text-gray-800 leading-tight">🌍 Ref Montessori School 🇹🇷</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(100%-73px-80px)] p-3 space-y-3">
            {/* Mobil Sidebar - E-REF Giriş */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white">
              <button
                onClick={() => setOpenMobileCard(openMobileCard === 'login' ? null : 'login')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-bold text-gray-800">E-REF</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openMobileCard === 'login' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-3 ${openMobileCard === 'login' ? 'block' : 'hidden'}`}>
                <form onSubmit={handleSubmit} className="space-y-3">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email-mobile" className="block text-xs font-medium text-gray-800 mb-1">
                      E-posta
                    </label>
                    <input
                      id="email-mobile"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      placeholder="ornek@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password-mobile" className="block text-xs font-medium text-gray-800 mb-1">
                      Şifre
                    </label>
                    <input
                      id="password-mobile"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
                  >
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </button>
                </form>

                <div className="text-center text-xs text-gray-800 mt-3">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Şifremi Unuttum
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={signInAsGuest}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    Misafir Olarak Giriş Yap
                  </button>
                  <p className="text-center text-xs text-gray-700 mt-2">
                    Sadece ana sayfa ve hakkımızda bölümünü görüntüleyebilirsiniz
                  </p>
                </div>
              </div>
            </div>

            {/* Mobil Sidebar - Hakkımızda */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white">
              <button
                onClick={() => setOpenMobileCard(openMobileCard === 'about' ? null : 'about')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-bold text-gray-800">Hakkımızda</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openMobileCard === 'about' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-3 space-y-2 ${openMobileCard === 'about' ? 'block' : 'hidden'}`}>
                {aboutLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    {aboutSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          handleAboutSectionClick(section.section_key);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                      >
                        {section.section_title}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Mobil Sidebar - REF Akademi */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white">
              <button
                onClick={() => setOpenMobileCard(openMobileCard === 'akademi' ? null : 'akademi')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-bold text-gray-800">REF Akademi</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openMobileCard === 'akademi' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-3 max-h-80 overflow-y-auto ${openMobileCard === 'akademi' ? 'block' : 'hidden'}`}>
                {refAkademiLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : refAkademi ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {refAkademi.title}
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {refAkademi.content}
                    </p>
                    {refAkademi.media_urls && refAkademi.media_urls.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {refAkademi.media_urls.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={url}
                              alt={`${refAkademi.title} - ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-700">Bu bölüm için henüz içerik eklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobil Sidebar - REF Atölye */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white">
              <button
                onClick={() => setOpenMobileCard(openMobileCard === 'atolye' ? null : 'atolye')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-bold text-gray-800">REF Atölye</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openMobileCard === 'atolye' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-3 max-h-80 overflow-y-auto ${openMobileCard === 'atolye' ? 'block' : 'hidden'}`}>
                {refAtolyeLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : refAtolye ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {refAtolye.title}
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {refAtolye.content}
                    </p>
                    {refAtolye.media_urls && refAtolye.media_urls.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {refAtolye.media_urls.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={url}
                              alt={`${refAtolye.title} - ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-700">Bu bölüm için henüz içerik eklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobil Sidebar - REF Danışmanlık */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white">
              <button
                onClick={() => setOpenMobileCard(openMobileCard === 'applications' ? null : 'applications')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-bold text-gray-800">{t('login.applications')}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openMobileCard === 'applications' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-3 max-h-80 overflow-y-auto ${openMobileCard === 'applications' ? 'block' : 'hidden'}`}>
                {refDanismanlikLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : refDanismanlik ? (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800">
                        {refDanismanlik.title}
                      </h4>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {refDanismanlik.content}
                      </p>
                      {refDanismanlik.media_urls && refDanismanlik.media_urls.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          {refDanismanlik.media_urls.map((url, index) => (
                            <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                              <img
                                src={url}
                                alt={`${refDanismanlik.title} - ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <button
                        onClick={() => {
                          setShowReferenceTeacherForm(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                      >
                        {t('login.referenceTeacher')}
                      </button>
                      <p className="text-center text-xs text-gray-700 mt-2">
                        {t('login.referenceTeacherDesc')}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowReferenceTeacherForm(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                    >
                      {t('login.referenceTeacher')}
                    </button>
                    <p className="text-center text-xs text-gray-700 mt-2">
                      {t('login.referenceTeacherDesc')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobil Sidebar - İletişim */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white">
              <button
                onClick={() => setOpenMobileCard(openMobileCard === 'contact' ? null : 'contact')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-bold text-gray-800">İletişim</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openMobileCard === 'contact' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-3 space-y-3 ${openMobileCard === 'contact' ? 'block' : 'hidden'}`}>
                <button
                  onClick={() => {
                    setShowContactPage(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  {t('login.contactInfo')}
                </button>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs text-gray-700">
                  <p className="font-medium">📍 Arnavutköy - İstanbul</p>
                  <p className="font-medium">📞 0531 550 44 54</p>
                  <p className="font-medium break-all">✉️ bilgi@refcocukakademisi.com</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <button
                    onClick={() => {
                      setShowInquiryForm(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    {t('login.inquiryForm')}
                  </button>
                  <p className="text-center text-xs text-gray-700 mt-2">
                    {t('login.inquiryFormDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bize Ulaşın - Sabit Alt Bölüm */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-teal-500 to-teal-600 p-3 border-t-2 border-teal-700">
            <h3 className="text-sm font-bold text-white text-center mb-2">Bize Ulaşın</h3>
            <div className="flex items-center justify-center gap-4">
              <a
                href="tel:05315504454"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="Telefon: 0531 550 44 54"
              >
                <Phone className="w-5 h-5 text-white" />
              </a>
              <a
                href="mailto:bilgi@refcocukakademisi.com"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="E-posta: bilgi@refcocukakademisi.com"
              >
                <Mail className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://maps.google.com/?q=Arnavutköy,İstanbul"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="Konum: Arnavutköy - İstanbul"
              >
                <MapPin className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://www.refcocukakademisi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="Web: www.refcocukakademisi.com"
              >
                <Globe className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Masaüstü Hamburger Menü - Sidebar */}
      <div
        className={`hidden md:block fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isDesktopMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDesktopMenuOpen(false)}
      >
        <div
          className={`fixed left-0 top-0 bottom-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 ${
            isDesktopMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-base font-bold text-gray-800 leading-tight">🌍 Ref Montessori School 🇹🇷</h2>
            <button
              onClick={() => setIsDesktopMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
          </div>

          <div className="overflow-y-auto h-[calc(100%-73px-80px)] p-4 space-y-4">
            {/* E-REF Giriş */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white">
              <button
                onClick={() => setOpenDesktopCard(openDesktopCard === 'login' ? null : 'login')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base font-bold text-gray-800">E-REF</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openDesktopCard === 'login' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-4 ${openDesktopCard === 'login' ? 'block' : 'hidden'}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email-desktop" className="block text-sm font-medium text-gray-800 mb-2">
                      E-posta
                    </label>
                    <input
                      id="email-desktop"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      placeholder="ornek@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password-desktop" className="block text-sm font-medium text-gray-800 mb-2">
                      Şifre
                    </label>
                    <input
                      id="password-desktop"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
                  >
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </button>
                </form>

                <div className="text-center text-sm text-gray-800 mt-3">
                  <button
                    onClick={() => setShowForgotPassword(true)}
                    className="text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Şifremi Unuttum
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={signInAsGuest}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    Misafir Olarak Giriş Yap
                  </button>
                  <p className="text-center text-xs text-gray-700 mt-2">
                    Sadece ana sayfa ve hakkımızda bölümünü görüntüleyebilirsiniz
                  </p>
                </div>
              </div>
            </div>

            {/* Hakkımızda */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white">
              <button
                onClick={() => setOpenDesktopCard(openDesktopCard === 'about' ? null : 'about')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base font-bold text-gray-800">Hakkımızda</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openDesktopCard === 'about' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-4 space-y-2 ${openDesktopCard === 'about' ? 'block' : 'hidden'}`}>
                {aboutLoading ? (
                  <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : (
                  <>
                    {aboutSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          handleAboutSectionClick(section.section_key);
                          setIsDesktopMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-all text-sm font-medium"
                      >
                        {section.section_title}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* REF Akademi */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white">
              <button
                onClick={() => setOpenDesktopCard(openDesktopCard === 'akademi' ? null : 'akademi')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base font-bold text-gray-800">REF Akademi</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openDesktopCard === 'akademi' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-4 max-h-80 overflow-y-auto ${openDesktopCard === 'akademi' ? 'block' : 'hidden'}`}>
                {refAkademiLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : refAkademi ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {refAkademi.title}
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {refAkademi.content}
                    </p>
                    {refAkademi.media_urls && refAkademi.media_urls.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {refAkademi.media_urls.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={url}
                              alt={`${refAkademi.title} - ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-700">Bu bölüm için henüz içerik eklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>

            {/* REF Atölye */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white">
              <button
                onClick={() => setOpenDesktopCard(openDesktopCard === 'atolye' ? null : 'atolye')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base font-bold text-gray-800">REF Atölye</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openDesktopCard === 'atolye' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-4 max-h-80 overflow-y-auto ${openDesktopCard === 'atolye' ? 'block' : 'hidden'}`}>
                {refAtolyeLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : refAtolye ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-800">
                      {refAtolye.title}
                    </h4>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {refAtolye.content}
                    </p>
                    {refAtolye.media_urls && refAtolye.media_urls.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-3">
                        {refAtolye.media_urls.map((url, index) => (
                          <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                            <img
                              src={url}
                              alt={`${refAtolye.title} - ${index + 1}`}
                              className="w-full h-32 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-700">Bu bölüm için henüz içerik eklenmemiş.</p>
                  </div>
                )}
              </div>
            </div>

            {/* REF Danışmanlık */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white">
              <button
                onClick={() => setOpenDesktopCard(openDesktopCard === 'applications' ? null : 'applications')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base font-bold text-gray-800">{t('login.applications')}</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openDesktopCard === 'applications' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-4 max-h-80 overflow-y-auto ${openDesktopCard === 'applications' ? 'block' : 'hidden'}`}>
                {refDanismanlikLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-800 border-t-transparent"></div>
                  </div>
                ) : refDanismanlik ? (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800">
                        {refDanismanlik.title}
                      </h4>
                      <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {refDanismanlik.content}
                      </p>
                      {refDanismanlik.media_urls && refDanismanlik.media_urls.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          {refDanismanlik.media_urls.map((url, index) => (
                            <div key={index} className="rounded-lg overflow-hidden shadow-sm">
                              <img
                                src={url}
                                alt={`${refDanismanlik.title} - ${index + 1}`}
                                className="w-full h-32 object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <button
                        onClick={() => {
                          setShowReferenceTeacherForm(true);
                          setIsDesktopMenuOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                      >
                        {t('login.referenceTeacher')}
                      </button>
                      <p className="text-center text-xs text-gray-700 mt-2">
                        {t('login.referenceTeacherDesc')}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowReferenceTeacherForm(true);
                        setIsDesktopMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                    >
                      {t('login.referenceTeacher')}
                    </button>
                    <p className="text-center text-xs text-gray-700 mt-2">
                      {t('login.referenceTeacherDesc')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* İletişim */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white">
              <button
                onClick={() => setOpenDesktopCard(openDesktopCard === 'contact' ? null : 'contact')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base font-bold text-gray-800">İletişim</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openDesktopCard === 'contact' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-4 space-y-3 ${openDesktopCard === 'contact' ? 'block' : 'hidden'}`}>
                <button
                  onClick={() => {
                    setShowContactPage(true);
                    setIsDesktopMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  {t('login.contactInfo')}
                </button>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs text-gray-700">
                  <p className="font-medium">📍 Arnavutköy - İstanbul</p>
                  <p className="font-medium">📞 0531 550 44 54</p>
                  <p className="font-medium break-all">✉️ bilgi@refcocukakademisi.com</p>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <button
                    onClick={() => {
                      setShowInquiryForm(true);
                      setIsDesktopMenuOpen(false);
                    }}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm"
                  >
                    {t('login.inquiryForm')}
                  </button>
                  <p className="text-center text-xs text-gray-700 mt-2">
                    {t('login.inquiryFormDesc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bize Ulaşın - Sabit Alt Bölüm */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-teal-500 to-teal-600 p-3 border-t-2 border-teal-700">
            <h3 className="text-sm font-bold text-white text-center mb-2">Bize Ulaşın</h3>
            <div className="flex items-center justify-center gap-4">
              <a
                href="tel:05315504454"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="Telefon: 0531 550 44 54"
              >
                <Phone className="w-5 h-5 text-white" />
              </a>
              <a
                href="mailto:bilgi@refcocukakademisi.com"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="E-posta: bilgi@refcocukakademisi.com"
              >
                <Mail className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://maps.google.com/?q=Arnavutköy,İstanbul"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="Konum: Arnavutköy - İstanbul"
              >
                <MapPin className="w-5 h-5 text-white" />
              </a>
              <a
                href="https://www.refcocukakademisi.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title="Web: www.refcocukakademisi.com"
              >
                <Globe className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onNavigate={(tab) => {
          signInAsGuest(tab);
        }}
        userRole="guest"
      />

    </div>
  );
}
