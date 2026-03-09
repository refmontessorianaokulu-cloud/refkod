import { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, Sparkles, Home, Book, ShoppingBag, Phone, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  hasNavigation?: boolean;
  navigationDestination?: string;
  navigationLabel?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: any;
  action: () => void;
}

interface RefAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (destination: string) => void;
}

export default function RefAssistantModal({ isOpen, onClose, onNavigate }: RefAssistantModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [playGroupSessions, setPlayGroupSessions] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const fetchPlayGroupData = async () => {
      const { data } = await supabase
        .from('play_group_sessions')
        .select('*')
        .order('session_date', { ascending: true });

      if (data) {
        setPlayGroupSessions(data);
      }
    };

    if (isOpen) {
      fetchPlayGroupData();

      const savedMessages = localStorage.getItem('ref-assistant-messages');
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } else {
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          text: 'Merhaba! Ben Ref Asistan. Size nasıl yardımcı olabilirim?',
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages([welcomeMessage]);
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ref-assistant-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const handleResetChat = () => {
    setMessages([{
      id: Date.now().toString(),
      text: 'Merhaba! Ben Ref Asistan. Size nasıl yardımcı olabilirim?',
      sender: 'bot',
      timestamp: new Date()
    }]);
    localStorage.removeItem('ref-assistant-messages');
  };

  const quickActions: QuickAction[] = [
    {
      id: 'about',
      label: 'Hakkımızda Bilgi Al',
      icon: Home,
      action: () => handleQuickAction('Hakkımızda bilgi almak istiyorum', 'about')
    },
    {
      id: 'akademi',
      label: 'Ref Akademi Nedir?',
      icon: Book,
      action: () => handleQuickAction('Ref Akademi hakkında bilgi ver', 'ref_akademi')
    },
    {
      id: 'atolye',
      label: 'Ref Atölye Ürünleri',
      icon: ShoppingBag,
      action: () => handleQuickAction('Ref Atölye ürünlerini görmek istiyorum', 'ref_atolye')
    },
    {
      id: 'contact',
      label: 'İletişim Bilgileri',
      icon: Phone,
      action: () => handleQuickAction('İletişim bilgilerini öğrenmek istiyorum', 'contact')
    },
    {
      id: 'application',
      label: 'Başvuru Yap',
      icon: FileText,
      action: () => handleQuickAction('Başvuru yapmak istiyorum', 'application')
    }
  ];

  const handleQuickAction = (userMessage: string, destination: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      let botResponse = '';

      switch (destination) {
        case 'about':
          botResponse = 'Ref Çocuk Akademisi hakkında detaylı bilgi için sizi yönlendiriyorum...';
          break;
        case 'ref_akademi':
          botResponse = 'Ref Akademi Montessori eğitim felsefesini benimseyen bir okuldur. Detaylar için sizi yönlendiriyorum...';
          break;
        case 'ref_atolye':
          botResponse = 'Ref Atölye\'de eğitim materyalleri ve özel ürünler bulabilirsiniz. Ürünlere göz atmak için sizi yönlendiriyorum...';
          break;
        case 'contact':
          botResponse = 'İletişim bilgilerimiz:\n📍 Arnavutköy - İstanbul\n📞 0531 550 44 54\n✉️ bilgi@refcocukakademisi.com';
          break;
        case 'application':
          botResponse = 'Başvuru formu için sizi yönlendiriyorum. Formda gerekli bilgileri doldurabilirsiniz...';
          break;
        default:
          botResponse = 'Size yardımcı olmak için hazırım!';
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (destination !== 'contact') {
        setTimeout(() => {
          onNavigate(destination);
          onClose();
        }, 1500);
      }
    }, 1000);
  };

  const handleNavigationResponse = (accept: boolean, destination: string) => {
    if (accept) {
      onNavigate(destination);
      onClose();
    } else {
      const botMsg: Message = {
        id: Date.now().toString(),
        text: 'Anladım. Başka nasıl yardımcı olabilirim?',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentQuestion = inputText;
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const lowerText = currentQuestion.toLowerCase();
      let botResponse = '';
      let hasNavigation = false;
      let navigationDestination = '';
      let navigationLabel = '';

      if (lowerText.includes('oyun grup') || lowerText.includes('play group')) {
        if (playGroupSessions.length > 0) {
          const uniqueDays = [...new Set(playGroupSessions.map(s => {
            const date = new Date(s.session_date);
            return date.toLocaleDateString('tr-TR', { weekday: 'long' });
          }))];

          const upcomingSessions = playGroupSessions
            .filter(s => new Date(s.session_date) >= new Date())
            .slice(0, 3);

          botResponse = `Evet, oyun gruplarımız var! 🎨\n\n`;

          if (uniqueDays.length > 0) {
            botResponse += `📅 Günler: ${uniqueDays.join(', ')}\n\n`;
          }

          if (upcomingSessions.length > 0) {
            botResponse += `Yaklaşan seanslar:\n`;
            upcomingSessions.forEach(session => {
              const date = new Date(session.session_date);
              const dayName = date.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
              botResponse += `• ${dayName} (${session.capacity - session.current_bookings} kişi kaldı)\n`;
            });
          }

          botResponse += `\nOyun grupları sayfasına gitmek ister misiniz?`;
          hasNavigation = true;
          navigationDestination = 'playgroup';
          navigationLabel = 'Oyun Grupları Sayfası';
        } else {
          botResponse = 'Üzgünüm, şu anda oyun grupları hakkında bilgi bulunamadı.';
        }
      } else if (lowerText.includes('hakkımızda') || lowerText.includes('hakkında')) {
        botResponse = 'Ref Çocuk Akademisi, Montessori eğitim felsefesini benimseyen bir okuldur. Çocukların doğal öğrenme süreçlerini destekleyen, özgür ve keşfedici bir ortam sunuyoruz.\n\nHakkımızda sayfasına gitmek ister misiniz?';
        hasNavigation = true;
        navigationDestination = 'about';
        navigationLabel = 'Hakkımızda';
      } else if (lowerText.includes('akademi')) {
        botResponse = 'Ref Akademi, Montessori eğitim metodolojisini kullanan bir okuldur. Çocukların bireysel gelişimlerini destekleyen, yaratıcı ve özgür bir öğrenme ortamı sunuyoruz.\n\nRef Akademi sayfasına gitmek ister misiniz?';
        hasNavigation = true;
        navigationDestination = 'ref_akademi';
        navigationLabel = 'Ref Akademi';
      } else if (lowerText.includes('atölye') || lowerText.includes('ürün')) {
        botResponse = 'Ref Atölye\'de Montessori eğitim materyalleri, özel tasarım ürünler ve daha fazlasını bulabilirsiniz.\n\nRef Atölye sayfasına gitmek ister misiniz?';
        hasNavigation = true;
        navigationDestination = 'ref_atolye';
        navigationLabel = 'Ref Atölye';
      } else if (lowerText.includes('iletişim') || lowerText.includes('telefon') || lowerText.includes('adres')) {
        botResponse = 'İletişim bilgilerimiz:\n📍 Arnavutköy - İstanbul\n📞 0531 550 44 54\n✉️ bilgi@refcocukakademisi.com\n\nİletişim sayfasına gitmek ister misiniz?';
        hasNavigation = true;
        navigationDestination = 'contact';
        navigationLabel = 'İletişim';
      } else if (lowerText.includes('başvuru') || lowerText.includes('kayıt')) {
        botResponse = 'Okulumuz veya programlarımız için başvuru yapmak isterseniz başvuru formumuzu doldurabilirsiniz.\n\nBaşvuru formuna gitmek ister misiniz?';
        hasNavigation = true;
        navigationDestination = 'application';
        navigationLabel = 'Başvuru Formu';
      } else if (lowerText.includes('merhaba') || lowerText.includes('selam')) {
        botResponse = 'Merhaba! Size nasıl yardımcı olabilirim? Oyun grupları, eğitim programları, iletişim bilgileri gibi konularda soru sorabilirsiniz.';
      } else if (lowerText.includes('teşekkür')) {
        botResponse = 'Rica ederim! Başka bir konuda yardımcı olabilir miyim?';
      } else {
        botResponse = 'Size daha iyi yardımcı olabilmem için lütfen sorunuzu biraz daha detaylandırır mısınız? Oyun grupları, eğitim programları, iletişim bilgileri gibi konularda size yardımcı olabilirim.';
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        hasNavigation,
        navigationDestination,
        navigationLabel
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[80] flex items-end md:items-center justify-center md:justify-end p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:w-[400px] h-[85vh] md:h-[600px] md:rounded-2xl shadow-2xl flex flex-col animate-slideUp md:animate-fadeIn md:mr-6 md:mb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4 md:rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                Ref Asistan
                <Sparkles className="w-4 h-4 text-yellow-300" />
              </h2>
              <p className="text-emerald-100 text-xs">Aktif</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Sohbeti Yenile"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length === 1 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className="p-3 bg-white hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-all shadow-sm hover:shadow-md text-left"
                  >
                    <Icon className="w-5 h-5 text-emerald-600 mb-2" />
                    <span className="text-xs font-medium text-gray-700 block leading-tight">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  message.sender === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              {message.hasNavigation && message.navigationDestination && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleNavigationResponse(true, message.navigationDestination!)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors shadow-sm"
                  >
                    Evet, götür
                  </button>
                  <button
                    onClick={() => handleNavigationResponse(false, message.navigationDestination!)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm rounded-lg transition-colors"
                  >
                    Hayır
                  </button>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 md:rounded-b-2xl">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Mesajınızı yazın..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-md hover:shadow-lg w-10 h-10 flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
