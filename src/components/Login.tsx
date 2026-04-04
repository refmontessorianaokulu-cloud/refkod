import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import InquiryForm from './InquiryForm';
import ReferenceTeacherForm from './ReferenceTeacherForm';
import ContactPage from './ContactPage';
import RefAtolyeLogin from './RefAtolyeLogin';
import CartView from './CartView';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search as SearchIcon, Menu, X, Phone, Mail, MapPin, Globe, Volume2, VolumeX, MessageCircle, ShoppingBag, CircleUser as UserCircle, Bot, Calendar } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import SearchModal from './SearchModal';
import TypewriterSearchModal from './TypewriterSearchModal';
import RefAssistantModal from './RefAssistantModal';
import AnnouncementBanner from './AnnouncementBanner';
import AppointmentBooking from './AppointmentBooking';

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
  const [showAtolyeLogin, setShowAtolyeLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('videoMuted');
    return saved !== null ? saved === 'true' : true;
  });
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const forgotPasswordVideoRef = useRef<HTMLVideoElement>(null);
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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showTypewriterSearch, setShowTypewriterSearch] = useState(false);
  const [showRefAssistant, setShowRefAssistant] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
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

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    localStorage.setItem('videoMuted', String(newMutedState));

    if (videoRef.current) {
      videoRef.current.muted = newMutedState;
    }
    if (forgotPasswordVideoRef.current) {
      forgotPasswordVideoRef.current.muted = newMutedState;
    }
  };


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

  const handleWhatsAppClick = () => {
    setShowWhatsAppModal(true);
  };

  const handleWhatsAppSend = () => {
    const message = encodeURIComponent('Merhaba, Ref çocuk akademisine hoşgeldiniz. Size nasıl yardımcı olabiliriz?');
    const phoneNumber = '905315504454';
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    setShowWhatsAppModal(false);
  };

  useEffect(() => {
    const handleNavigateToPage = (event: CustomEvent) => {
      const route = event.detail;
      setIsMobileMenuOpen(false);
      setIsDesktopMenuOpen(false);

      switch (route) {
        case 'playgroup':
          signInAsGuest('play_group');
          break;
        case 'atolye':
          setShowAtolyeLogin(true);
          break;
        case 'ref_akademi':
          setIsRefAkademiCardOpen(true);
          break;
        case 'ref_danismanlik':
          setOpenMobileCard('ref_danismanlik');
          setOpenDesktopCard('ref_danismanlik');
          break;
        case 'contact':
          setShowContactPage(true);
          break;
        case 'login':
          setIsLoginCardOpen(true);
          break;
        case 'application':
          setIsApplicationCardOpen(true);
          break;
        case 'about':
          setIsAboutCardOpen(true);
          break;
      }
    };

    window.addEventListener('navigateToPage', handleNavigateToPage as EventListener);
    return () => {
      window.removeEventListener('navigateToPage', handleNavigateToPage as EventListener);
    };
  }, []);

  if (showInquiryForm) {
    return <InquiryForm onBack={() => setShowInquiryForm(false)} />;
  }

  if (showReferenceTeacherForm) {
    return <ReferenceTeacherForm />;
  }

  if (showContactPage) {
    return <ContactPage onBack={() => setShowContactPage(false)} />;
  }

  if (showAtolyeLogin) {
    return <RefAtolyeLogin onBack={() => setShowAtolyeLogin(false)} />;
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 bg-black overflow-hidden">
        {videoEnabled && videoUrl ? (
          <div
            className="absolute inset-0"
            onMouseEnter={() => setShowVolumeControl(true)}
            onMouseLeave={() => setShowVolumeControl(false)}
          >
            <video
              ref={forgotPasswordVideoRef}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              poster={posterUrl || undefined}
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/30" />

            <button
              onClick={toggleMute}
              className={`absolute bottom-6 left-6 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-300 ${
                showVolumeControl ? 'opacity-100' : 'opacity-0'
              } hidden md:block`}
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? (
                <VolumeX className="w-[30px] h-[30px] text-white" />
              ) : (
                <Volume2 className="w-[30px] h-[30px] text-white" />
              )}
            </button>
          </div>
        ) : null}

        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <button
            onClick={() => signInAsGuest('ref_atolye')}
            className="p-3 transition-all border-2 border-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100"
            title="Ref Atölye"
          >
            <ShoppingBag className="w-5 h-5 text-gray-700" />
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

        {/* Mobil - Alt Butonlar */}
        <div className="md:hidden fixed bottom-6 left-0 right-0 flex items-center justify-between z-50 px-6">
          <button
            onClick={() => setShowRefAssistant(true)}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all group relative p-2.5"
            aria-label="Ref Asistan"
          >
            <Bot className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
              !
            </span>
          </button>

          <button
            onClick={toggleMute}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all"
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>

          <button
            onClick={handleWhatsAppClick}
            className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all group relative p-2.5 animate-wave"
            aria-label="WhatsApp ile iletişime geç"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse w-4 h-4">
              1
            </span>
          </button>
        </div>

        {/* Masaüstü - Sağ Alt WhatsApp Butonu */}
        <button
          onClick={handleWhatsAppClick}
          className="hidden md:block fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 z-50 group"
          aria-label="WhatsApp ile iletişime geç"
        >
          <MessageCircle className="w-[30px] h-[30px]" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            1
          </span>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Ref'e dair her şey için...
          </span>
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative z-10">
          <div className="flex items-center justify-center mb-8 mt-4">
            <img
              src="/whatsapp_image_2026-01-10_at_23.02.15.png"
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
    <div className="min-h-screen relative flex flex-col bg-black overflow-hidden">
      {videoEnabled && videoUrl ? (
        <div
          className="absolute inset-0"
          onMouseEnter={() => setShowVolumeControl(true)}
          onMouseLeave={() => setShowVolumeControl(false)}
        >
          <video
            ref={videoRef}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            poster={posterUrl || undefined}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-black/30" />

          <button
            onClick={toggleMute}
            className={`absolute bottom-6 left-6 p-3 bg-black/50 hover:bg-black/70 rounded-full transition-all duration-300 z-10 ${
              showVolumeControl ? 'opacity-100' : 'opacity-0'
            } hidden md:block`}
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? (
              <VolumeX className="w-[30px] h-[30px] text-white" />
            ) : (
              <Volume2 className="w-[30px] h-[30px] text-white" />
            )}
          </button>
        </div>
      ) : null}

      {/* Mobil - Alt Butonlar */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 flex items-center justify-between z-50 px-6">
        <button
          onClick={() => setShowRefAssistant(true)}
          className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all group relative p-2.5"
          aria-label="Ref Asistan"
        >
          <Bot className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold animate-pulse">
            !
          </span>
        </button>

        <button
          onClick={toggleMute}
          className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all"
          title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>

        <button
          onClick={handleWhatsAppClick}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full shadow-xl hover:shadow-2xl transition-all group relative p-2.5 animate-wave"
          aria-label="WhatsApp ile iletişime geç"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse w-4 h-4">
            1
          </span>
        </button>
      </div>

      {/* Masaüstü - Sağ Alt WhatsApp Butonu */}
      <button
        onClick={handleWhatsAppClick}
        className="hidden md:block fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110 z-50 group"
        aria-label="WhatsApp ile iletişime geç"
      >
        <MessageCircle className="w-[30px] h-[30px]" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
          1
        </span>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Ref'e dair her şey için...
        </span>
      </button>

      {/* Announcement Banner */}
      <div className="relative z-50">
        <AnnouncementBanner />
      </div>

      {/* Top Header - Mobil ve Masaüstü - Fixed Position */}
      <div className="fixed left-0 right-0 z-40 px-4 py-3" style={{ top: 'var(--banner-height, 0px)' }}>
        <div className="flex items-center justify-between md:items-start md:justify-start md:gap-8">
          {/* Mobil - Logo Sol */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => {
                setIsMobileMenuOpen(true);
              }}
              className="transition-all"
            >
              <img
                src="/whatsapp_image_2026-01-10_at_23.02.15.png"
                alt="REF Logo"
                className="w-16 h-16 object-contain transition-all duration-300 hover:scale-105"
              />
            </button>
          </div>

          {/* Masaüstü - Sol Hamburger */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(true);
              setIsDesktopMenuOpen(true);
            }}
            className="hidden md:block p-2 transition-all flex-shrink-0 bg-[#C8E6D4] border-2 border-[#B5DCCA] rounded-lg hover:bg-[#B8E0CA] hover:border-[#A5D3BD]"
          >
            <Menu className="w-[30px] h-[30px] md:w-5 md:h-5 text-gray-800" />
          </button>

          {/* Masaüstü - Orta Logo */}
          <div className="hidden md:flex md:flex-1 md:justify-center">
            <button
              onClick={() => {
                const isMobile = window.innerWidth < 768;
                if (isMobile) {
                  signInAsGuest('ref_atolye');
                } else {
                  setIsDesktopMenuOpen(true);
                  setOpenDesktopCard('login');
                }
              }}
              className="transition-all"
            >
              <img
                src="/whatsapp_image_2026-01-10_at_23.02.15.png"
                alt="REF Logo"
                className="w-20 h-20 md:w-30 md:h-30 object-contain transition-all duration-300 hover:scale-105"
              />
            </button>
          </div>

          {/* Mobil - Sağ İkonlar */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setShowAppointmentBooking(true)}
              className="p-1 transition-all"
              title="Randevu Takvimi"
            >
              <Calendar className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowTypewriterSearch(true)}
              className="p-1 transition-all"
              title="Arama"
            >
              <SearchIcon className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="p-1 transition-all"
              title="Sepetim"
            >
              <ShoppingBag className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setShowAtolyeLogin(true)}
              className="p-1 transition-all"
              title="Hesabım"
            >
              <UserCircle className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(true);
              }}
              className="p-1 transition-all"
            >
              <Menu className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Masaüstü - Sağ Sepet */}
          <div className="hidden md:flex items-start gap-3">
            <button
              onClick={() => signInAsGuest('ref_atolye')}
              className="p-2 transition-all bg-[#C8E6D4] border-2 border-[#B5DCCA] rounded-lg hover:bg-[#B8E0CA] hover:border-[#A5D3BD]"
              title="Ref Atölye"
            >
              <ShoppingBag className="w-[30px] h-[30px] md:w-5 md:h-5 text-gray-800" />
            </button>
          </div>
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
          className={`fixed left-0 top-0 bottom-0 w-80 bg-white/95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 ${
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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

                  <div className="text-center text-xs text-gray-800 mt-3">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                </form>

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => signInAsGuest()}
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
              <button
                onClick={() => setOpenMobileCard(openMobileCard === 'refatolye' ? null : 'refatolye')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-sm font-bold text-gray-800">REF Atölye</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openMobileCard === 'refatolye' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-3 space-y-2 ${openMobileCard === 'refatolye' ? 'block' : 'hidden'}`}>
                <button
                  onClick={() => {
                    setShowAtolyeLogin(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Ref Atölye Giriş
                </button>
                <button
                  onClick={() => {
                    signInAsGuest('ref_atolye');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Misafir Olarak Gözat
                </button>
                <p className="text-center text-xs text-gray-700">
                  Ürünlerimizi görüntüleyin
                </p>
              </div>
            </div>

            {/* Mobil Sidebar - REF Danışmanlık */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-3 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
            <div className="flex items-center justify-center gap-3 flex-wrap">
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
              <button
                onClick={() => {
                  setShowSearchModal(true);
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full transition-all"
                title={t('search.placeholder')}
              >
                <SearchIcon className="w-5 h-5 text-white" />
              </button>
              <LanguageToggle contactStyle={true} />
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
          className={`fixed left-0 top-0 bottom-0 w-96 bg-white/95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 ${
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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

                  <div className="text-center text-sm text-gray-800 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                </form>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => signInAsGuest()}
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
              <button
                onClick={() => setOpenDesktopCard(openDesktopCard === 'refatolye' ? null : 'refatolye')}
                className="w-full flex items-center justify-between"
              >
                <h3 className="text-base font-bold text-gray-800">REF Atölye</h3>
                <ChevronDown
                  className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                    openDesktopCard === 'refatolye' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <div className={`mt-4 space-y-3 ${openDesktopCard === 'refatolye' ? 'block' : 'hidden'}`}>
                <button
                  onClick={() => {
                    setShowAtolyeLogin(true);
                    setIsDesktopMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-2 rounded-lg font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Ref Atölye Giriş
                </button>
                <button
                  onClick={() => {
                    signInAsGuest('ref_atolye');
                    setIsDesktopMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg text-sm"
                >
                  Misafir Olarak Gözat
                </button>
                <p className="text-center text-xs text-gray-700">
                  Ürünlerimizi görüntüleyin
                </p>
              </div>
            </div>

            {/* REF Danışmanlık */}
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
            <div className="border-2 border-teal-500 rounded-xl shadow-lg p-4 bg-white hover:border-teal-600 hover:bg-gray-50 transition-colors">
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
              <LanguageToggle contactStyle={true} />
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

      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-end justify-end p-4 pb-6 pr-24" onClick={() => setShowWhatsAppModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm relative animate-fadeIn" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute top-3 right-3 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>

            <div className="flex items-center justify-center mb-4">
              <img
                src="/whatsapp_image_2026-01-10_at_23.02.15.png"
                alt="REF Logo"
                className="w-16 h-16 object-contain"
              />
            </div>

            <h2 className="text-lg font-bold text-center text-gray-800 mb-3">
              WhatsApp ile İletişime Geçin
            </h2>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-gray-700 text-center text-sm leading-relaxed">
                Merhaba, Ref çocuk akademisine hoşgeldiniz. Size nasıl yardımcı olabiliriz?
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleWhatsAppSend}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2.5 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Mesaj Gönder
              </button>

              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-all text-sm"
              >
                İptal
              </button>
            </div>

            <div className="mt-3 text-center text-xs text-gray-600">
              <p>📞 0531 550 44 54</p>
            </div>
          </div>
        </div>
      )}

      <TypewriterSearchModal
        isOpen={showTypewriterSearch}
        onClose={() => setShowTypewriterSearch(false)}
        onSearch={(query) => {
          console.log('Arama:', query);
        }}
        onNavigate={(section) => {
          setShowTypewriterSearch(false);
          if (section === 'about') {
            signInAsGuest('about');
          } else if (section === 'contact') {
            setShowContactPage(true);
          } else if (section === 'ref_atolye') {
            signInAsGuest('ref_atolye');
          } else if (section === 'play_group') {
            signInAsGuest('play_group');
          } else if (section === 'home') {
            signInAsGuest();
          }
        }}
      />

      <RefAssistantModal
        isOpen={showRefAssistant}
        onClose={() => setShowRefAssistant(false)}
        onNavigate={(destination) => {
          signInAsGuest(destination);
        }}
      />

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Sepetim</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            <div className="p-6">
              <CartView
                onStartShopping={() => {
                  setShowCart(false);
                  signInAsGuest('ref_atolye');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {showAppointmentBooking && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Randevu Takvimi</h2>
              <button
                onClick={() => setShowAppointmentBooking(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-700" />
              </button>
            </div>
            <div>
              <AppointmentBooking />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
