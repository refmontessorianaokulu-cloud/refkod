import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface TypewriterInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export default function TypewriterInput({ value, onChange, onClear }: TypewriterInputProps) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [displayText, setDisplayText] = useState('');

  const placeholders = [
    'Ref Atölyede ürün ara...',
    'Montessori oyuncakları...',
    'Eğitici materyaller...',
    'Sanat malzemeleri...',
  ];

  useEffect(() => {
    const currentPlaceholder = placeholders[placeholderIndex];
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (charIndex < currentPlaceholder.length) {
            setDisplayText(currentPlaceholder.slice(0, charIndex + 1));
            setCharIndex(charIndex + 1);
          } else {
            setTimeout(() => setIsDeleting(true), 2000);
          }
        } else {
          if (charIndex > 0) {
            setDisplayText(currentPlaceholder.slice(0, charIndex - 1));
            setCharIndex(charIndex - 1);
          } else {
            setIsDeleting(false);
            setPlaceholderIndex((placeholderIndex + 1) % placeholders.length);
          }
        }
      },
      isDeleting ? 50 : 100
    );

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, placeholderIndex]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        placeholder={displayText}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center z-10"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}
