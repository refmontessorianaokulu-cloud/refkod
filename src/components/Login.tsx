import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InquiryForm from './InquiryForm';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      const error = err as any;
      if (error.message?.includes('onaylanmamış')) {
        setError('Hesabınız henüz yönetici tarafından onaylanmamış. Lütfen onay için bekleyin.');
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

  if (showInquiryForm) {
    return <InquiryForm onBack={() => setShowInquiryForm(false)} />;
  }

  if (showForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-8 mt-4">
            <img
              src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
              alt="REF Logo"
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
            Şifremi Unuttum
          </h1>
          <p className="text-center text-gray-600 mb-8">
            E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz
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
                E-posta
              </label>
              <input
                id="resetEmail"
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="ornek@email.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Linki Gönder'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            <button
              onClick={() => setShowForgotPassword(false)}
              className="text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              Giriş sayfasına dön
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center mb-12 mt-4">
          <img
            src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
            alt="REF Logo"
            className="w-32 h-32 object-contain"
          />
        </div>
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
          REF
        </h1>
        <p className="text-center text-gray-600 mb-8">Öğrenci Takip Sistemi</p>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 mt-6">
          <button
            onClick={() => setShowForgotPassword(true)}
            className="text-green-600 hover:text-green-700 font-medium transition-colors"
          >
            Şifremi Unuttum
          </button>
        </div>

        <div className="border-t border-gray-200 mt-6 pt-6">
          <p className="text-center text-sm text-gray-600 mb-3">
            Henüz hesabınız yok mu?
          </p>
          <button
            onClick={() => setShowInquiryForm(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            Ön Bilgi Talep Formu
          </button>
          <p className="text-center text-xs text-gray-500 mt-2">
            Formu doldurarak yönetici ile iletişime geçebilirsiniz
          </p>
        </div>
      </div>
    </div>
  );
}
