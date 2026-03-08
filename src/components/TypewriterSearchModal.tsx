import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';

interface TypewriterSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

const searchSuggestions = [
  'Montessori',
  'Montessori Eğitimi',
  'Eğitim Materyalleri',
  'Ref Akademi',
  'Ref Danışmanlık',
  'Ref Atölye',
  'Başvuru Formu',
  'İletişim',
  'Kreş',
  'Anaokulu',
  'Gelişim Raporları',
  'Öğretmen',
  'Rehber Öğretmen',
  'Ücretler',
  'Kayıt',
];

export default function TypewriterSearchModal({ isOpen, onClose, onSearch }: TypewriterSearchModalProps) {
  const [searchValue, setSearchValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const fullText = 'Ne arıyorsunuz?';

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
      const filtered = searchSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 5);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [searchValue]);

  const handleSearch = (query: string) => {
    if (onSearch && query.trim()) {
      onSearch(query);
      onClose();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchValue(suggestion);
    handleSearch(suggestion);
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
      className="fixed inset-0 bg-black/60 z-[90] flex items-start justify-center pt-20 md:pt-32 p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Arama</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-emerald-500" />
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
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-gray-700 placeholder-gray-400 text-lg"
            />
          </div>

          {filteredSuggestions.length > 0 && (
            <div className="mt-2 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors border-b border-gray-200 last:border-b-0 flex items-center gap-3"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
