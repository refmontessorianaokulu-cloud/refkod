import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TypewriterSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
  onNavigate?: (section: string) => void;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface SearchItem {
  title: string;
  keywords: string[];
  section: string;
}

const searchItems: SearchItem[] = [
  { title: 'Montessori Eğitimi', keywords: ['montessori', 'eğitim', 'pedagoji', 'çocuk gelişimi'], section: 'about' },
  { title: 'Hakkımızda', keywords: ['hakkımızda', 'hakkinda', 'kurumsal', 'vizyonumuz', 'misyonumuz'], section: 'about' },
  { title: 'İletişim', keywords: ['iletişim', 'iletisim', 'adres', 'telefon', 'e-posta', 'email', 'konum'], section: 'contact' },
  { title: 'Başvuru Formu', keywords: ['başvuru', 'basvuru', 'form', 'kayıt', 'kayit', 'ön kayıt', 'on kayit'], section: 'contact' },
  { title: 'Ref Atölye', keywords: ['ref atölye', 'ref atolye', 'atölye', 'atolye', 'ürünler', 'urunler', 'mağaza', 'magaza', 'alışveriş', 'alisveris'], section: 'ref_atolye' },
  { title: 'Ref Atölye Ürünleri', keywords: ['ürün', 'urun', 'satış', 'satis', 'materyal', 'eğitim materyali'], section: 'ref_atolye' },
  { title: 'Oyun Grubu', keywords: ['oyun grubu', 'play group', 'oyun', 'grup', 'etkinlik', 'aktivite'], section: 'play_group' },
  { title: 'Oyun Grubu Rezervasyon', keywords: ['rezervasyon', 'randevu', 'kayıt yap', 'kayit yap'], section: 'play_group' },
  { title: 'Kreş', keywords: ['kreş', 'kres', 'anaokulu', 'yuva', '0-3 yaş', '0-6 yaş'], section: 'about' },
  { title: 'Anaokulu', keywords: ['anaokulu', 'okul öncesi', 'okul oncesi', '3-6 yaş'], section: 'about' },
  { title: 'Ücretler', keywords: ['ücret', 'ucret', 'fiyat', 'ödeme', 'odeme', 'tutar'], section: 'about' },
  { title: 'Öğretmenler', keywords: ['öğretmen', 'ogretmen', 'eğitimci', 'egitimci', 'kadro', 'personel'], section: 'about' },
  { title: 'Rehber Öğretmen', keywords: ['rehber', 'rehberlik', 'danışman', 'danisman', 'psikolojik danışman'], section: 'about' },
  { title: 'Gelişim Raporları', keywords: ['gelişim', 'gelisim', 'rapor', 'değerlendirme', 'degerlendirme', 'izleme'], section: 'about' },
  { title: 'Instagram', keywords: ['instagram', 'sosyal medya', 'paylaşım', 'paylasim', 'fotoğraf', 'fotograf'], section: 'home' },
];

export default function TypewriterSearchModal({ isOpen, onClose, onSearch, onNavigate }: TypewriterSearchModalProps) {
  const [searchValue, setSearchValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<SearchItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allSearchItems, setAllSearchItems] = useState<SearchItem[]>(searchItems);
  const inputRef = useRef<HTMLInputElement>(null);
  const fullText = 'Ne arıyorsunuz?';

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, category')
        .eq('is_active', true);

      if (data && !error) {
        setProducts(data);

        const productSearchItems: SearchItem[] = data.map(product => ({
          title: product.name,
          keywords: [
            product.name.toLowerCase(),
            product.category.toLowerCase(),
            ...product.name.toLowerCase().split(' ')
          ],
          section: 'ref_atolye'
        }));

        setAllSearchItems([...searchItems, ...productSearchItems]);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPlaceholder('');
      setSearchValue('');
      setFilteredSuggestions([]);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      let currentIndex = 0;
      const typingSpeed = 100;

      const typeInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setPlaceholder(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, typingSpeed);

      return () => clearInterval(typeInterval);
    } else {
      setPlaceholder('');
      setFilteredSuggestions([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase().trim();

      const filtered = allSearchItems.filter(item => {
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const keywordMatch = item.keywords.some(keyword =>
          keyword.toLowerCase().includes(searchLower)
        );
        return titleMatch || keywordMatch;
      }).slice(0, 8);

      console.log('Arama:', searchValue, 'Sonuçlar:', filtered);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchValue, allSearchItems]);

  const handleSearch = (query: string) => {
    if (onSearch && query.trim()) {
      onSearch(query);
      onClose();
    }
  };

  const handleSuggestionClick = (item: SearchItem) => {
    if (onNavigate) {
      onNavigate(item.section);
    }
    onClose();
  };

  const handleClose = () => {
    setSearchValue('');
    setPlaceholder('');
    setFilteredSuggestions([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[90] flex items-start justify-center pt-16 md:pt-24 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-800">Arama</h2>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-emerald-500" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchValue.trim()) {
                  handleSearch(searchValue);
                }
              }}
              placeholder={placeholder}
              className="w-full pl-10 pr-3 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>

          {filteredSuggestions.length > 0 && (
            <div className="mt-2 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden max-h-64 overflow-y-auto">
              {filteredSuggestions.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(item)}
                  className="w-full px-3 py-2.5 text-left hover:bg-emerald-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700 text-sm">{item.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
