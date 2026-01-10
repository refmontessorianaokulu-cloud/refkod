import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, Video, Trash2, Image, CheckCircle, XCircle } from 'lucide-react';

export default function VideoUploadSection() {
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('login_video_url, login_video_active, login_video_poster')
        .single();

      if (!error && data) {
        setVideoUrl(data.login_video_url || '');
        setPosterUrl(data.login_video_poster || '');
        setVideoEnabled(data.login_video_active || false);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('Video dosyası 20 MB\'dan büyük olamaz.');
      return;
    }

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      setError('Sadece MP4, WebM veya MOV formatlarında video yükleyebilirsiniz.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `login-video-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const { error: uploadError } = await supabase.storage
        .from('login-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('login-videos')
        .getPublicUrl(filePath);

      const newVideoUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ login_video_url: newVideoUrl })
        .eq('id', (await supabase.from('app_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      setVideoUrl(newVideoUrl);
      setSuccess('Video başarıyla yüklendi!');
      setTimeout(() => setUploadProgress(0), 2000);
    } catch (err: any) {
      setError('Video yükleme başarısız: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError('Poster görseli 5 MB\'dan büyük olamaz.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `login-poster-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('login-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('login-videos')
        .getPublicUrl(filePath);

      const newPosterUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ login_video_poster: newPosterUrl })
        .eq('id', (await supabase.from('app_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      setPosterUrl(newPosterUrl);
      setSuccess('Poster görseli başarıyla yüklendi!');
    } catch (err: any) {
      setError('Poster yükleme başarısız: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVideo = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const newStatus = !videoEnabled;

      const { error: updateError } = await supabase
        .from('app_settings')
        .update({ login_video_active: newStatus })
        .eq('id', (await supabase.from('app_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      setVideoEnabled(newStatus);
      setSuccess(newStatus ? 'Video aktif edildi!' : 'Video pasif edildi!');
    } catch (err: any) {
      setError('Durum güncellenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirm('Videoyu silmek istediğinizden emin misiniz?')) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: updateError } = await supabase
        .from('app_settings')
        .update({
          login_video_url: '',
          login_video_active: false
        })
        .eq('id', (await supabase.from('app_settings').select('id').single()).data?.id);

      if (updateError) throw updateError;

      setVideoUrl('');
      setVideoEnabled(false);
      setSuccess('Video başarıyla silindi!');
    } catch (err: any) {
      setError('Video silinemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Video className="w-6 h-6 text-green-600" />
            Login Sayfası Video Ayarları
          </h2>
        </div>

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Arka Plan Videosu Yükle
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              MP4, WebM veya MOV formatında, maksimum 20 MB
            </p>

            <label
              htmlFor="video-upload"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-green-700 transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-5 h-5" />
              Video Seç
            </label>
            <input
              id="video-upload"
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={handleVideoUpload}
              disabled={loading}
              className="hidden"
            />

            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">Yükleniyor... {uploadProgress}%</p>
              </div>
            )}
          </div>

          {videoUrl && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Video Önizleme</h4>
              <video
                src={videoUrl}
                poster={posterUrl || undefined}
                controls
                className="w-full max-h-96 rounded-lg shadow-lg"
              >
                Video yüklenemedi.
              </video>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={videoEnabled}
                      onChange={handleToggleVideo}
                      disabled={loading}
                      className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Video Aktif
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleDeleteVideo}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Videoyu Sil
                </button>
              </div>
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Poster Görseli Yükle (Opsiyonel)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Video yüklenirken gösterilecek kapak görseli (maksimum 5 MB)
            </p>

            <label
              htmlFor="poster-upload"
              className={`inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold cursor-pointer hover:bg-blue-700 transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-5 h-5" />
              Poster Seç
            </label>
            <input
              id="poster-upload"
              type="file"
              accept="image/*"
              onChange={handlePosterUpload}
              disabled={loading}
              className="hidden"
            />

            {posterUrl && (
              <div className="mt-4">
                <img
                  src={posterUrl}
                  alt="Video Poster"
                  className="max-w-xs mx-auto rounded-lg shadow-md"
                />
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Kullanım Talimatları:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Video dosyası maksimum 20 MB olmalıdır</li>
              <li>Desteklenen formatlar: MP4, WebM, MOV</li>
              <li>Video yükledikten sonra "Video Aktif" kutucuğunu işaretleyin</li>
              <li>Poster görseli, video yüklenirken gösterilir (opsiyonel)</li>
              <li>Video login sayfasında arka plan olarak görünecektir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
