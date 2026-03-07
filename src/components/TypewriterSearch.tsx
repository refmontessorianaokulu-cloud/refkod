import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

interface TypewriterSearchProps {
  onSearch?: (query: string) => void;
  className?: string;
}

export default function TypewriterSearch({ onSearch, className = '' }: TypewriterSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fullText = 'Ref Atölyede ürün ara...';

  useEffect(() => {
    const typingSpeed = isDeleting ? 50 : 100;
    const pauseDuration = 2000;

    const timer = setTimeout(() => {
      if (!isDeleting && placeholder.length < fullText.length) {
        setPlaceholder(fullText.slice(0, placeholder.length + 1));
      } else if (!isDeleting && placeholder.length === fullText.length) {
        setTimeout(() => setIsDeleting(true), pauseDuration);
      } else if (isDeleting && placeholder.length > 0) {
        setPlaceholder(fullText.slice(0, placeholder.length - 1));
      } else if (isDeleting && placeholder.length === 0) {
        setIsDeleting(false);
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [placeholder, isDeleting]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchValue.trim()) {
      onSearch(searchValue);
    }
  };

  return (
    <form onSubmit={handleSearch} className={`w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-20 py-3.5 bg-white border-2 border-gray-100 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-gray-700 placeholder-gray-400"
        />
        {searchValue && (
          <button
            type="submit"
            className="absolute inset-y-0 right-2 my-1.5 px-4 flex items-center justify-center text-white bg-emerald-600 hover:bg-emerald-700 font-medium text-sm rounded-lg transition-colors z-20"
          >
            Ara
          </button>
        )}
      </div>
    </form>
  );
}
