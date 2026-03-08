import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';

interface TypewriterSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string) => void;
}

export default function TypewriterSearchModal({ isOpen, onClose, onSearch }: TypewriterSearchModalProps) {
  const [searchValue, setSearchValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fullText = 'Ne arıyorsunuz?';

  useEffect(() => {
    if (isOpen) {
      setPlaceholder('');
      setSearchValue('');

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
    }
  }, [isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchValue.trim()) {
      onSearch(searchValue);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchValue('');
    setPlaceholder('');
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

          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-emerald-500" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-none text-gray-700 placeholder-gray-400 text-lg"
              />
            </div>

            {searchValue && (
              <button
                type="submit"
                className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
              >
                Ara
              </button>
            )}
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3 font-medium">Popüler Aramalar:</p>
            <div className="flex flex-wrap gap-2">
              {['Montessori', 'Eğitim Materyalleri', 'Ref Akademi', 'Başvuru', 'İletişim'].map((keyword) => (
                <button
                  key={keyword}
                  onClick={() => {
                    setSearchValue(keyword);
                    inputRef.current?.focus();
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 rounded-full text-sm font-medium transition-all border border-gray-200 hover:border-emerald-300"
                >
                  {keyword}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
