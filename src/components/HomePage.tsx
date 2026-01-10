import { useState, useEffect } from 'react';
import { ArrowRight, Globe, Sparkles } from 'lucide-react';
import AnnouncementCarousel from './AnnouncementCarousel';
import InstagramFeed from './InstagramFeed';

interface HomePageProps {
  onNavigateToAbout: () => void;
  userFullName?: string;
  onSignOut?: () => void;
}

export default function HomePage({ onNavigateToAbout }: HomePageProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-green-50 to-teal-50">
      <div
        className={`transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="bg-gradient-to-r from-amber-50 to-green-50 py-12 lg:py-16 px-4">
          <div className="max-w-6xl mx-auto text-center space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 mt-8 lg:mt-0">
                <Globe className="w-6 h-6 lg:w-8 lg:h-8 text-emerald-600" />
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                  Montessori School
                </h1>
                <span className="text-3xl">🇹🇷</span>
              </div>
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-emerald-800 leading-tight">
                Ref Çocuk Akademisine HOŞGELDİNİZ!
              </h2>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16 space-y-12">
          <div
            className="relative rounded-3xl overflow-hidden shadow-2xl"
            style={{
              backgroundImage: "url('/whatsapp_image_2026-01-08_at_14.06.07_(1).jpeg')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: '500px',
            }}
          >
            <div className="absolute inset-0 bg-black/40" />

            <div className="relative z-10 p-8 lg:p-12 flex items-center min-h-[500px]">
              <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 lg:p-12">
                <div className="flex items-center space-x-3 mb-6">
                  <Sparkles className="w-8 h-8 text-emerald-600" />
                  <h3 className="text-3xl lg:text-4xl font-bold text-emerald-800">
                    Ref Çocuk Akademisi
                  </h3>
                </div>

                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p className="text-lg">
                    Ref Çocuk Akademisi olarak, Montessori eğitim felsefesini benimseyerek çocuklarımızın
                    doğal öğrenme süreçlerini destekliyoruz. Her çocuğun benzersiz potansiyelini keşfetmesi
                    ve geliştirmesi için güvenli, destekleyici ve zengin bir öğrenme ortamı sunuyoruz.
                  </p>
                  <p className="text-lg hidden lg:block">
                    Deneyimli eğitmenlerimiz ve özel olarak hazırlanmış Montessori materyallerimizle,
                    çocuklarımız kendi hızlarında ilerleyerek pratik hayat becerileri, akademik temeller
                    ve sosyal gelişim kazanırlar.
                  </p>
                  <p className="text-lg hidden lg:block">
                    Okul öncesi eğitimde deneyimimizle, her çocuğa değer veren, onların
                    bireysel farklılıklarını destekleyen ve özgüven kazandıran bir eğitim anlayışına sahibiz.
                  </p>
                </div>

                <button
                  onClick={onNavigateToAbout}
                  className="mt-8 group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <span>Devamını Oku</span>
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>

          <AnnouncementCarousel />

          <InstagramFeed />
        </div>
      </div>
    </div>
  );
}
