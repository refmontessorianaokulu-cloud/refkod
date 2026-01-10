import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface RefSection {
  id: string;
  section_type: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
  title: string;
  content: string;
  media_urls: string[];
  created_at: string;
}

interface RefSectionsViewProps {
  sectionType: 'ref_akademi' | 'ref_danismanlik' | 'ref_atolye';
}

const SECTION_LABELS = {
  ref_akademi: 'Ref Akademi',
  ref_danismanlik: 'Ref Danışmanlık',
  ref_atolye: 'Ref Atölye',
};

export default function RefSectionsView({ sectionType }: RefSectionsViewProps) {
  const [section, setSection] = useState<RefSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSection();
  }, [sectionType]);

  const loadSection = async () => {
    try {
      const { data, error } = await supabase
        .from('ref_sections')
        .select('*')
        .eq('section_type', sectionType)
        .maybeSingle();

      if (error) throw error;
      setSection(data);
    } catch (error) {
      console.error('Error loading ref section:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          {SECTION_LABELS[sectionType]}
        </h2>
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Bu bölüm için henüz içerik eklenmemiş.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {SECTION_LABELS[sectionType]}
      </h2>

      <h3 className="text-xl font-semibold text-gray-700 mb-4">
        {section.title}
      </h3>

      <div className="prose max-w-none">
        <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
          {section.content}
        </p>
      </div>

      {section.media_urls && section.media_urls.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {section.media_urls.map((url, index) => (
            <div key={index} className="rounded-lg overflow-hidden shadow-sm">
              <img
                src={url}
                alt={`${section.title} - ${index + 1}`}
                className="w-full h-48 object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
