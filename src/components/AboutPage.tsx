import { useState, useEffect } from 'react';
import { ArrowLeft, Target, Eye, Sparkles, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AboutSection {
  id: string;
  section_key: string;
  section_title: string;
  content: string;
  image_url: string | null;
  display_order: number;
}

interface AboutPageProps {
  onNavigateHome: () => void;
  initialSection?: string | null;
}

const sectionIcons: Record<string, any> = {
  mission: Target,
  vision: Eye,
  montessori_philosophy: Sparkles,
  education_programs: GraduationCap,
};

export default function AboutPage({ onNavigateHome, initialSection }: AboutPageProps) {
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    loadAboutContent();
  }, []);

  useEffect(() => {
    if (!loading && initialSection && sections.length > 0) {
      setTimeout(() => {
        scrollToSection(initialSection);
      }, 300);
    }
  }, [loading, initialSection, sections]);

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map((section) =>
        document.getElementById(`section-${section.section_key}`)
      );

      let currentSection = '';
      sectionElements.forEach((element) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            currentSection = element.id.replace('section-', '');
          }
        }
      });

      if (currentSection) {
        setActiveSection(currentSection);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const loadAboutContent = async () => {
    try {
      const { data, error } = await supabase
        .from('about_content')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (error) {
      console.error('Error loading about content:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (sectionKey: string) => {
    const element = document.getElementById(`section-${sectionKey}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: "url('/whatsapp_image_2026-01-08_at_14.06.07_(1).jpeg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <button
        onClick={onNavigateHome}
        className="fixed top-6 left-6 z-50 flex items-center space-x-2 px-4 py-2 bg-white/95 backdrop-blur-sm text-emerald-700 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Ana Sayfa</span>
      </button>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-24 space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Hakkımızda
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md">
            Ref'e dair bir kaç şey...
          </p>
        </div>

        {sections.map((section, index) => {
          const Icon = sectionIcons[section.section_key] || Sparkles;
          return (
            <div
              key={section.id}
              id={`section-${section.section_key}`}
              className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 lg:p-12 transition-all duration-700 ${
                index % 2 === 0 ? 'slide-in-left' : 'slide-in-right'
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-emerald-100 rounded-xl">
                  <Icon className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-3xl lg:text-4xl font-bold text-emerald-800">
                  {section.section_title}
                </h2>
              </div>

              {section.image_url && (
                <div className="mb-6 rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={section.image_url}
                    alt={section.section_title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              <div className="prose prose-lg max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative z-10 bg-white/95 backdrop-blur-sm py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <button
            onClick={onNavigateHome}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>
      </div>
    </div>
  );
}
