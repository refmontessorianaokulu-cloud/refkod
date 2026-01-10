import { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, CheckCircle, XCircle, ExternalLink, Instagram, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InstagramPost {
  id: string;
  caption?: string;
  media_url: string;
  thumbnail_url?: string;
}

export default function InstagramSettings() {
  const [accessToken, setAccessToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [previewPosts, setPreviewPosts] = useState<InstagramPost[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'instagram_access_token')
        .maybeSingle();

      if (error) throw error;
      setAccessToken(data?.value || '');
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!accessToken.trim()) {
      alert('Lütfen bir access token giriniz');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ value: accessToken })
        .eq('key', 'instagram_access_token');

      if (error) throw error;

      alert('Ayarlar kaydedildi');
      setTestResult(null);
      setPreviewPosts([]);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Hata: Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  const testToken = async () => {
    if (!accessToken.trim()) {
      alert('Lütfen bir access token giriniz');
      return;
    }

    setTesting(true);
    setTestResult(null);
    setTestMessage('');
    setPreviewPosts([]);

    try {
      const response = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_url,thumbnail_url&access_token=${accessToken}&limit=3`
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Token geçersiz');
      }

      setTestResult('success');
      setTestMessage('Token geçerli! Instagram hesabınıza başarıyla bağlandı.');
      setPreviewPosts(data.data || []);
    } catch (error) {
      console.error('Token test error:', error);
      setTestResult('error');
      setTestMessage(
        error instanceof Error
          ? error.message
          : 'Token test edilemedi. Lütfen token\'ın doğru olduğundan emin olun.'
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Instagram Ayarları</h2>
        <p className="text-gray-600 mt-1">
          Ana sayfadaki Instagram feed için API erişim ayarlarını yapılandırın
        </p>
      </div>

      <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-3">
            <Instagram className="w-6 h-6 text-pink-500" />
            <h3 className="text-lg font-bold text-gray-800">
              Instagram Access Token Nasıl Alınır?
            </h3>
          </div>
          {showInstructions ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {showInstructions && (
          <div className="mt-4 space-y-3 text-gray-700 border-t border-pink-200 pt-4">
            <p className="font-semibold text-gray-800">Adım adım talimatlar:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-700 underline inline-flex items-center space-x-1"
                >
                  <span>Facebook Developer Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                {' '}sayfasına gidin ve bir uygulama oluşturun
              </li>
              <li>Uygulamanıza "Instagram Basic Display" ekleyin</li>
              <li>Instagram hesabınızı test kullanıcısı olarak ekleyin</li>
              <li>"Instagram Basic Display" ayarlarından "Generate Token" butonuna tıklayın</li>
              <li>Oluşturulan Long-Lived Access Token'ı kopyalayın</li>
              <li>Token'ı aşağıdaki alana yapıştırın ve kaydedin</li>
            </ol>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>Not:</strong> Long-Lived Token'lar 60 gün geçerlidir. Süre dolmadan yenilenmeleri gerekir.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instagram Access Token
          </label>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="IGQVJYourAccessTokenHere..."
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showToken ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={saveSettings}
            disabled={saving || !accessToken.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
          <button
            onClick={testToken}
            disabled={testing || !accessToken.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            <RefreshCw className={`w-5 h-5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Test Ediliyor...' : 'Token\'ı Test Et'}</span>
          </button>
        </div>

        {testResult && (
          <div
            className={`flex items-start space-x-3 p-4 rounded-lg ${
              testResult === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {testResult === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  testResult === 'success' ? 'text-green-800' : 'text-red-800'
                }`}
              >
                {testResult === 'success' ? 'Başarılı!' : 'Hata!'}
              </p>
              <p
                className={`text-sm mt-1 ${
                  testResult === 'success' ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {testMessage}
              </p>
            </div>
          </div>
        )}

        {previewPosts.length > 0 && (
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
              <Instagram className="w-5 h-5 text-pink-500" />
              <span>Son 3 Gönderi Önizlemesi</span>
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {previewPosts.map((post) => (
                <div
                  key={post.id}
                  className="aspect-square rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                >
                  <img
                    src={post.thumbnail_url || post.media_url}
                    alt={post.caption?.substring(0, 50) || 'Instagram post'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Instagram className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Instagram Business API Hakkında</p>
            <p>
              Token kaydedildikten sonra, ana sayfada otomatik olarak Instagram gönderileriniz gösterilecektir.
              Feed her 5 dakikada bir önbellekten sunulur, bu yüzden yeni gönderiler anında görünmeyebilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
