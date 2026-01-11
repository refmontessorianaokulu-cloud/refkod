import { useLanguage } from '../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
  isMobile?: boolean;
}

export default function LanguageToggle({ className = '', isMobile = false }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (isMobile) {
    return (
      <div className={`flex flex-col gap-0.5 bg-white/90 backdrop-blur-sm rounded-lg p-0.5 shadow-md ${className}`} style={{ flexDirection: 'column' }}>
        <button
          onClick={() => setLanguage('tr')}
          className={`w-full px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${
            language === 'tr'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          TR
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`w-full px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${
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

  return (
    <div className={`flex flex-row gap-0.5 bg-white/90 backdrop-blur-sm rounded-lg p-0.5 shadow-md ${className}`}>
      <button
        onClick={() => setLanguage('tr')}
        className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${
          language === 'tr'
            ? 'bg-red-600 text-white shadow-md'
            : 'text-red-600 hover:bg-red-50'
        }`}
      >
        TR
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1.5 rounded-md text-xs font-semibold transition-all ${
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
