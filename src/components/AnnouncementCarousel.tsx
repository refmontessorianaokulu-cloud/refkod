import { useState, useEffect } from 'react';
import { Megaphone, ChevronLeft, ChevronRight, Calendar, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Announcement {
  id: string;
  title: string;
  content: string;
  media_url?: string | null;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

export default function AnnouncementCarousel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, announcements.length]);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToPrevious = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-emerald-500 bg-emerald-50';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Megaphone className="w-7 h-7 text-emerald-600" />
          <h3 className="text-2xl font-bold text-gray-800">Son Duyurular</h3>
        </div>
        <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Megaphone className="w-7 h-7 text-emerald-600" />
          <h3 className="text-2xl font-bold text-gray-800">Son Duyurular</h3>
        </div>
        <div className="text-center py-12">
          <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Henüz duyuru bulunmuyor</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center space-x-2 mb-6">
          <Megaphone className="w-7 h-7 text-emerald-600" />
          <h3 className="text-2xl font-bold text-gray-800">Son Duyurular</h3>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-xl">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="w-full flex-shrink-0 px-2"
                >
                  <div
                    className={`border-l-4 ${getPriorityColor(
                      announcement.priority
                    )} rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow cursor-pointer`}
                    onClick={() => setSelectedAnnouncement(announcement)}
                  >
                    <div className="flex items-start space-x-4">
                      {announcement.media_url && (
                        <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={announcement.media_url}
                            alt={announcement.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                          {announcement.title}
                        </h4>
                        <p className="text-gray-600 mb-3 line-clamp-3">
                          {truncateText(announcement.content, 150)}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {announcements.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 text-gray-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 text-gray-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {announcements.length > 1 && (
          <div className="flex justify-center space-x-2 mt-6">
            {announcements.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-emerald-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {selectedAnnouncement && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
                <Megaphone className="w-6 h-6 text-emerald-600" />
                <span>Duyuru Detayı</span>
              </h3>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedAnnouncement.media_url && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={selectedAnnouncement.media_url}
                    alt={selectedAnnouncement.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div>
                <h4 className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedAnnouncement.title}
                </h4>
                <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(selectedAnnouncement.created_at)}</span>
                </div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
