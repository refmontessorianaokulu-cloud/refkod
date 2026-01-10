import { useLanguage } from '../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
}

export default function LanguageToggle({ className = '' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-md ${className}`}>
      <button
        onClick={() => setLanguage('tr')}
        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
          language === 'tr'
            ? 'bg-red-600 text-white shadow-md'
            : 'text-red-600 hover:bg-red-50'
        }`}
      >
        TR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
          language === 'en'
            ? 'bg-blue-600 text-white shadow-md'
            : 'text-blue-600 hover:bg-blue-50'
        }`}
      >
        EN
      </button>
    </div>
  );
}
