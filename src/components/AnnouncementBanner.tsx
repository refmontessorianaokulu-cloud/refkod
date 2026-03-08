import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface AnnouncementBanner {
  id: string;
  message_tr: string;
  message_en: string | null;
  link_url: string | null;
  link_text_tr: string | null;
  link_text_en: string | null;
  is_active: boolean;
  display_order: number;
}

export default function AnnouncementBanner() {
  const { language } = useLanguage();
  const [banners, setBanners] = useState<AnnouncementBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const [onLinkClick, setOnLinkClick] = useState<((route: string) => void) | null>(null);

  useEffect(() => {
    loadBanners();
  }, []);

  useEffect(() => {
    if (bannerRef.current && isVisible && !isClosing) {
      const height = bannerRef.current.offsetHeight;
      document.documentElement.style.setProperty('--banner-height', `${height}px`);
    } else {
      document.documentElement.style.setProperty('--banner-height', '0px');
    }
  }, [isVisible, isClosing, banners.length, currentIndex]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const loadBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('announcement_banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setBanners(data || []);
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handleLinkClick = (e: React.MouseEvent, url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      e.preventDefault();
      const event = new CustomEvent('navigateToPage', { detail: url });
      window.dispatchEvent(event);
    }
  };

  if (!isVisible || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  const message = language === 'tr' ? currentBanner.message_tr : (currentBanner.message_en || currentBanner.message_tr);
  const linkText = language === 'tr' ? currentBanner.link_text_tr : (currentBanner.link_text_en || currentBanner.link_text_tr);

  return (
    <div className="pt-2 px-2">
      <div
        ref={bannerRef}
        className={`bg-green-600/20 backdrop-blur-sm rounded-2xl transition-all duration-300 ${
          isClosing ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {banners.length > 1 && (
              <button
                onClick={handlePrev}
                className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Previous announcement"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
            )}

            <div className="flex-1 flex flex-row items-center justify-center gap-2 md:gap-3 min-h-[32px]">
              <p className="text-xs md:text-sm text-white font-medium text-center whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2">
                {message}
              </p>

              {currentBanner.link_url && linkText && (
                <a
                  href={currentBanner.link_url}
                  onClick={(e) => handleLinkClick(e, currentBanner.link_url!)}
                  className="flex-shrink-0 px-4 py-2 bg-white/90 text-green-700 text-xs md:text-sm font-semibold rounded-full hover:bg-white transition-colors whitespace-nowrap shadow-sm touch-manipulation cursor-pointer"
                >
                  {linkText}
                </a>
              )}
            </div>

            {banners.length > 1 && (
              <button
                onClick={handleNext}
                className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                aria-label="Next announcement"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            )}

            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1.5 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close announcement"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {banners.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentIndex
                      ? 'bg-white w-6'
                      : 'bg-white/50 hover:bg-white/70 w-1.5'
                  }`}
                  aria-label={`Go to announcement ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
