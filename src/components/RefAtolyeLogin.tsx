import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft } from 'lucide-react';

interface RefAtolyeLoginProps {
  onBack: () => void;
  onLoginSuccess?: () => void;
}

export default function RefAtolyeLogin({ onBack, onLoginSuccess }: RefAtolyeLoginProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInAsGuest } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await signIn(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      const error = err as any;
      console.error('Login error:', error);
      if (error.message?.includes('Invalid login credentials')) {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: authData.user.email,
              full_name: fullName,
              role: 'atolye_user',
              approved: true,
            },
          ]);

        if (profileError) throw profileError;

        await supabase.auth.signOut();

        setSuccess('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        setFullName('');
        setConfirmPassword('');
        setTimeout(() => {
          setMode('login');
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      const error = err as any;
      console.error('Registration error:', error);
      if (error.message?.includes('already registered')) {
        setError('Bu e-posta adresi zaten kayıtlı.');
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Kayıt başarısız. Lütfen tekrar deneyin.');
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      setSuccess('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      setEmail('');
    } catch (err) {
      setError('Şifre sıfırlama e-postası gönderilemedi. Lütfen e-posta adresinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAsGuest('ref_atolye');
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      setError('Misafir girişi başarısız.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
        <button
          onClick={onBack}
          className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        <div className="flex items-center justify-center mb-8 mt-4">
          <img
            src="/whatsapp_image_2026-01-10_at_23.02.15.png"
            alt="REF Logo"
            className="w-24 h-24 object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {mode === 'login' && 'Ref Atölyeye Hoşgeldiniz'}
          {mode === 'register' && 'Ref Atölye Kayıt'}
          {mode === 'forgot' && 'Şifremi Unuttum'}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {mode === 'login' && 'Hesabınıza giriş yapın'}
          {mode === 'register' && 'Yeni hesap oluşturun'}
          {mode === 'forgot' && 'Şifrenizi sıfırlamak için e-posta adresinizi girin'}
        </p>

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">veya</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all border border-gray-300"
            >
              Misafir Olarak Giriş Yap
            </button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Şifremi Unuttum
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Kayıt Ol
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-6">
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
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Ad Soyad
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Ad Soyad"
              />
            </div>

            <div>
              <label htmlFor="registerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                id="registerEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="ornek@email.com"
              />
            </div>

            <div>
              <label htmlFor="registerPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre
              </label>
              <input
                id="registerPassword"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>

            <div className="text-center mt-6">
              <span className="text-gray-600 text-sm">Zaten hesabınız var mı? </span>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-emerald-600 hover:text-emerald-700 font-bold text-base transition-colors"
              >
                GİRİŞ YAP
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
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
              <label htmlFor="forgotEmail" className="block text-sm font-medium text-gray-700 mb-2">
                E-posta
              </label>
              <input
                id="forgotEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="ornek@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-orange-600 hover:text-orange-700 font-medium transition-colors text-sm"
              >
                Giriş sayfasına dön
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
