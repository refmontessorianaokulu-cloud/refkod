import { useState, useEffect } from 'react';
import { Instagram, ExternalLink, Heart, MessageCircle, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InstagramPost {
  id: string;
  caption?: string;
  media_type?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp?: string;
  posted_date?: string;
  is_manual?: boolean;
}

export default function InstagramFeed() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadInstagramFeed();
  }, []);

  const loadInstagramFeed = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: manualPosts, error: manualError } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(9);

      if (manualError) throw manualError;

      if (manualPosts && manualPosts.length > 0) {
        const formattedPosts: InstagramPost[] = manualPosts.map(post => ({
          id: post.id,
          caption: post.caption || undefined,
          media_url: post.image_url,
          permalink: post.post_url || '#',
          posted_date: post.posted_date,
          is_manual: true,
        }));
        setPosts(formattedPosts);
        setLoading(false);
        return;
      }

      const cachedData = localStorage.getItem('instagram-feed');
      const cachedTimestamp = localStorage.getItem('instagram-feed-timestamp');

      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp);
        const fiveMinutes = 5 * 60 * 1000;
        if (Date.now() - timestamp < fiveMinutes) {
          setPosts(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }

      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'instagram_access_token')
        .maybeSingle();

      if (settingsError) throw settingsError;

      const accessToken = settingsData?.value;

      if (!accessToken) {
        setError('Instagram bağlantısı kurulmadı. Lütfen yönetici ile iletişime geçin.');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${accessToken}&limit=9`
      );

      if (!response.ok) {
        throw new Error('Instagram verisi alınamadı');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Instagram API hatası');
      }

      const instagramPosts = data.data || [];
      setPosts(instagramPosts);

      localStorage.setItem('instagram-feed', JSON.stringify(instagramPosts));
      localStorage.setItem('instagram-feed-timestamp', Date.now().toString());

      setRetryCount(0);
    } catch (err) {
      console.error('Instagram feed error:', err);
      setError(err instanceof Error ? err.message : 'Bilinmeyen bir hata oluştu');

      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(retryCount + 1);
          loadInstagramFeed();
        }, 2000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    localStorage.removeItem('instagram-feed');
    localStorage.removeItem('instagram-feed-timestamp');
    loadInstagramFeed();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2 whitespace-nowrap">
            <Instagram className="w-6 h-6 sm:w-7 sm:h-7 text-pink-500 flex-shrink-0" />
            <span>Ref Instagram</span>
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2 whitespace-nowrap">
            <Instagram className="w-6 h-6 sm:w-7 sm:h-7 text-pink-500 flex-shrink-0" />
            <span>Ref Instagram</span>
          </h3>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-700 mb-4">{error}</p>
          {retryCount < 3 && (
            <button
              onClick={handleRefresh}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tekrar Dene</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center space-x-2 whitespace-nowrap">
            <Instagram className="w-6 h-6 sm:w-7 sm:h-7 text-pink-500 flex-shrink-0" />
            <span>Ref Instagram</span>
          </h3>
        </div>
        <div className="text-center py-12">
          <Instagram className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Henüz gönderi bulunmuyor</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 flex items-center space-x-2">
          <Instagram className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-pink-500 flex-shrink-0" />
          <span className="truncate">Ref Instagram</span>
        </h3>
        <button
          onClick={handleRefresh}
          className="p-1.5 sm:p-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-lg transition-all flex-shrink-0"
          title="Yenile"
        >
          <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
        {posts.map((post) => (
          <div
            key={post.id}
            className="group relative aspect-square overflow-hidden rounded-lg cursor-pointer shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => window.open(post.permalink, '_blank')}
          >
            <img
              src={post.media_type === 'VIDEO' && post.thumbnail_url ? post.thumbnail_url : post.media_url}
              alt={post.caption?.substring(0, 50) || 'Instagram post'}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-2">
              <div className="text-white text-center space-y-1 sm:space-y-2">
                <ExternalLink className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
                {post.caption && (
                  <p className="text-xs sm:text-sm px-2 sm:px-4 line-clamp-2">{post.caption}</p>
                )}
              </div>
            </div>
            {post.media_type === 'VIDEO' && (
              <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                Video
              </div>
            )}
            {post.media_type === 'CAROUSEL_ALBUM' && (
              <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-black/70 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                Albüm
              </div>
            )}
            {post.is_manual && (
              <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-semibold">
                Manuel
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-center">
        <a
          href="https://www.instagram.com/refcocukakademisi/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
        >
          <Instagram className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">Bizi Instagram'da Takip Edin</span>
          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        </a>
      </div>
    </div>
  );
}
