import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import InquiryForm from './InquiryForm';
import ReferenceTeacherForm from './ReferenceTeacherForm';
import ContactPage from './ContactPage';
import { supabase } from '../lib/supabase';
import { ChevronDown, Search as SearchIcon } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import SearchModal from './SearchModal';

interface AboutSection {
  id: string;
  section_key: string;
  section_title: string;
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
  const [showSearchModal, setShowSearchModal] = useState(false);
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

    loadVideoSettings();
    loadAboutSections();
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
    <div className="min-h-screen relative flex flex-col p-4 md:p-8 md:items-center md:justify-start md:pt-16">
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

      {/* Logo en üstte - Tüm ekranlar */}
      <div className="flex justify-center pt-2 pb-6 relative z-10">
        <img
          src="/whatsapp_image_2026-01-10_at_23.02.15.png"
          alt="REF Logo"
          className="w-32 h-32 md:w-48 md:h-48 object-contain drop-shadow-2xl"
          style={{ mixBlendMode: 'multiply' }}
        />
      </div>

      {/* Masaüstü: 2x2 Grid Layout */}
      <div className="hidden md:grid grid-cols-2 gap-6 lg:gap-8 relative z-10 max-w-4xl mx-auto w-full px-4">
        {/* Sol Üst - Giriş */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
          <button
            onClick={() => setIsLoginCardOpen(!isLoginCardOpen)}
            className="w-full flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              {t('login.title')}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isLoginCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 ${isLoginCardOpen ? 'block' : 'hidden'}`}>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-gray-800 mb-1">
                  {t('login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-gray-800 mb-1">
                  {t('login.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
                  placeholder={t('login.passwordPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm"
              >
                {loading ? t('login.loggingIn') : t('login.loginButton')}
              </button>
            </form>

            <div className="text-center text-xs text-gray-800 mt-3">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="text-green-600 hover:text-green-700 font-medium transition-colors"
              >
                {t('login.forgotPassword')}
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-white/30">
              <button
                onClick={signInAsGuest}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-md hover:shadow-lg text-sm"
              >
                {t('login.guestLogin')}
              </button>
              <p className="text-center text-xs text-gray-700 mt-2">
                {t('login.guestLoginDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Üst - Başvuru Formları */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
          <button
            onClick={() => setIsApplicationCardOpen(!isApplicationCardOpen)}
            className="w-full flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              {t('login.applications')}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isApplicationCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 space-y-4 ${isApplicationCardOpen ? 'block' : 'hidden'}`}>
            <div>
              <button
                onClick={() => setShowInquiryForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm"
              >
                {t('login.inquiryForm')}
              </button>
              <p className="text-center text-xs text-gray-700 mt-2">
                {t('login.inquiryFormDesc')}
              </p>
            </div>

            <div className="border-t border-white/30 pt-4">
              <button
                onClick={() => setShowReferenceTeacherForm(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
              >
                {t('login.referenceTeacher')}
              </button>
              <p className="text-center text-xs text-gray-700 mt-2">
                {t('login.referenceTeacherDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Sol Alt - Hakkımızda */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
          <button
            onClick={() => setIsAboutCardOpen(!isAboutCardOpen)}
            className="w-full flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              {t('login.about')}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isAboutCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 space-y-2 ${isAboutCardOpen ? 'block' : 'hidden'}`}>
            {aboutLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-800 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {aboutSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleAboutSectionClick(section.section_key)}
                    className="w-full text-left px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white/95 transition-all text-sm font-medium"
                  >
                    {section.section_title}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Sağ Alt - İletişim */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
          <button
            onClick={() => setIsContactCardOpen(!isContactCardOpen)}
            className="w-full flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              {t('login.contact')}
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isContactCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 space-y-3 ${isContactCardOpen ? 'block' : 'hidden'}`}>
            <button
              onClick={() => setShowContactPage(true)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
            >
              {t('login.contactInfo')}
            </button>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs text-gray-700">
              <p className="font-medium">📍 Arnavutköy - İstanbul</p>
              <p className="font-medium">📞 0531 550 44 54</p>
              <p className="font-medium break-all">✉️ bilgi@refcocukakademisi.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobil: Alt kısımda kartlar */}
      <div className="flex-1 flex flex-col items-center justify-end gap-6 relative z-10 max-w-7xl mx-auto w-full pb-4 md:hidden">
        {/* Mobil - Giriş */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 w-64">
          <button
            onClick={() => setIsLoginCardOpen(!isLoginCardOpen)}
            className="w-full flex items-center justify-center gap-2"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              E-REF
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isLoginCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 ${isLoginCardOpen ? 'block' : 'hidden'}`}>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="bg-red-50/90 backdrop-blur-sm border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
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
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
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
                  className="w-full px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
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

            <div className="mt-4 pt-4 border-t border-white/30">
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

        {/* Mobil - Başvuru Formları */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 w-64">
          <button
            onClick={() => setIsApplicationCardOpen(!isApplicationCardOpen)}
            className="w-full flex items-center justify-center gap-2"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              Başvuru Formları
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isApplicationCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 space-y-4 ${isApplicationCardOpen ? 'block' : 'hidden'}`}>
            <div>
              <button
                onClick={() => setShowInquiryForm(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm"
              >
                {t('login.inquiryForm')}
              </button>
              <p className="text-center text-xs text-gray-700 mt-2">
                {t('login.inquiryFormDesc')}
              </p>
            </div>

            <div className="border-t border-white/30 pt-4">
              <button
                onClick={() => setShowReferenceTeacherForm(true)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
              >
                {t('login.referenceTeacher')}
              </button>
              <p className="text-center text-xs text-gray-700 mt-2">
                {t('login.referenceTeacherDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Mobil - Hakkımızda */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 w-64">
          <button
            onClick={() => setIsAboutCardOpen(!isAboutCardOpen)}
            className="w-full flex items-center justify-center gap-2"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              Hakkımızda
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isAboutCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 space-y-2 ${isAboutCardOpen ? 'block' : 'hidden'}`}>
            {aboutLoading ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-800 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {aboutSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleAboutSectionClick(section.section_key)}
                    className="w-full text-left px-4 py-2 bg-white/80 backdrop-blur-sm text-gray-800 rounded-lg hover:bg-white/95 transition-all text-sm font-medium"
                  >
                    {section.section_title}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Mobil - İletişim */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 w-64">
          <button
            onClick={() => setIsContactCardOpen(!isContactCardOpen)}
            className="w-full flex items-center justify-center gap-2"
          >
            <h2 className="text-lg font-bold text-center text-gray-800">
              İletişim
            </h2>
            <ChevronDown
              className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${
                isContactCardOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <div className={`mt-4 space-y-3 ${isContactCardOpen ? 'block' : 'hidden'}`}>
            <button
              onClick={() => setShowContactPage(true)}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg text-sm"
            >
              {t('login.contactInfo')}
            </button>
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-3 space-y-2 text-xs text-gray-700">
              <p className="font-medium">📍 Arnavutköy - İstanbul</p>
              <p className="font-medium">📞 0531 550 44 54</p>
              <p className="font-medium break-all">✉️ bilgi@refcocukakademisi.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
