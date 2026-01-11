import { useLanguage } from '../contexts/LanguageContext';

interface LanguageToggleProps {
  className?: string;
  isMobile?: boolean;
  contactStyle?: boolean;
}

export default function LanguageToggle({ className = '', isMobile = false, contactStyle = false }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  if (contactStyle) {
    return (
      <div className={`flex gap-2 ${className}`}>
        <button
          onClick={() => setLanguage('tr')}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
            language === 'tr'
              ? 'bg-white/40'
              : 'bg-white/20 hover:bg-white/30'
          }`}
          title="Türkçe"
        >
          <span className="text-xs font-bold text-white">TR</span>
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
            language === 'en'
              ? 'bg-white/40'
              : 'bg-white/20 hover:bg-white/30'
          }`}
          title="English"
        >
          <span className="text-xs font-bold text-white">EN</span>
        </button>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={`flex flex-row gap-0.5 bg-white/90 backdrop-blur-sm rounded-lg p-0.5 shadow-md ${className}`}>
        <button
          onClick={() => setLanguage('tr')}
          className={`px-1.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
            language === 'tr'
              ? 'bg-red-600 text-white shadow-md'
              : 'text-red-600 hover:bg-red-50'
          }`}
        >
          TR
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-1.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
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
