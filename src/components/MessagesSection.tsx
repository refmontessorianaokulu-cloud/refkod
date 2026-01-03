import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageSquare, Plus, X, Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'teacher' | 'parent';
}

interface MessagesSectionProps {
  userId: string;
  userRole: 'admin' | 'teacher' | 'parent';
}

export default function MessagesSection({ userId, userRole }: MessagesSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'my' | 'all'>('my');

  const [form, setForm] = useState({
    receiver_id: '',
    subject: '',
    content: '',
  });

  useEffect(() => {
    loadMessages();
    loadContacts();
  }, [userId, viewMode]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      let query = supabase.from('messages').select('*');

      if (userRole === 'admin' && viewMode === 'all') {
        const { data: teachers } = await supabase
          .from('profiles')
          .select('id')
          .eq('role', 'teacher')
          .eq('approved', true);

        if (teachers && teachers.length > 0) {
          const teacherIds = teachers.map(t => t.id);
          const conditions = teacherIds.map(id => `sender_id.eq.${id},receiver_id.eq.${id}`).join(',');
          query = query.or(conditions);
        }
      } else {
        query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('id', userId)
        .eq('approved', true);

      if (error) {
        console.error('Error loading contacts:', error);
        setContacts([]);
        return;
      }

      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: userId,
        ...form,
      });
      if (error) throw error;

      setShowComposeModal(false);
      setForm({ receiver_id: '', subject: '', content: '' });
      loadMessages();
      alert('Mesaj gönderildi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId);
      loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleReply = (message: Message) => {
    const replyToId = message.sender_id === userId ? message.receiver_id : message.sender_id;
    const replySubject = message.subject.startsWith('Re: ') ? message.subject : `Re: ${message.subject}`;

    setForm({
      receiver_id: replyToId,
      subject: replySubject,
      content: '',
    });

    setSelectedMessage(null);
    setShowComposeModal(true);
  };

  const getContactName = async (contactId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', contactId)
      .maybeSingle();
    return data?.full_name || 'Bilinmeyen';
  };

  const [contactNames, setContactNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadContactNames = async () => {
      const names: Record<string, string> = {};
      for (const message of messages) {
        const otherId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        if (!names[otherId]) {
          names[otherId] = await getContactName(otherId);
        }
      }
      setContactNames(names);
    };
    if (messages.length > 0) {
      loadContactNames();
    }
  }, [messages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2 rounded-xl">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Mesajlar</h2>
        </div>
        <button
          onClick={() => setShowComposeModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-teal-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
          <span>Yeni Mesaj</span>
        </button>
      </div>

      {userRole === 'admin' && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('my')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'my'
                ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Kendi Mesajlarım
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'all'
                ? 'bg-gradient-to-br from-teal-500 to-cyan-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tüm Öğretmen Mesajları
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz mesaj yok</div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const isReceived = message.receiver_id === userId;
            const otherPersonId = isReceived ? message.sender_id : message.receiver_id;
            const otherPersonName = contactNames[otherPersonId] || 'Yükleniyor...';
            const senderName = contactNames[message.sender_id] || 'Yükleniyor...';
            const receiverName = contactNames[message.receiver_id] || 'Yükleniyor...';
            const isViewingAll = userRole === 'admin' && viewMode === 'all';

            return (
              <div
                key={message.id}
                onClick={() => {
                  setSelectedMessage(message);
                  if (isReceived && !message.read && !isViewingAll) {
                    markAsRead(message.id);
                  }
                }}
                className={`bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                  isReceived && !message.read && !isViewingAll ? 'bg-teal-50 border-teal-200' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {isViewingAll ? (
                        <>
                          <span className="text-xs px-2 py-1 bg-blue-100 rounded text-blue-600">
                            Gönderen: {senderName}
                          </span>
                          <span className="text-xs px-2 py-1 bg-green-100 rounded text-green-600">
                            Alıcı: {receiverName}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                            {isReceived ? 'Gönderen' : 'Alıcı'}: {otherPersonName}
                          </span>
                          {isReceived && !message.read && (
                            <span className="text-xs px-2 py-1 bg-teal-500 text-white rounded font-medium">
                              Yeni
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-800">{message.subject}</h3>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                    {new Date(message.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{message.content}</p>
              </div>
            );
          })}
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">{selectedMessage.subject}</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {userRole === 'admin' && viewMode === 'all' ? (
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Gönderen:</span>
                    <span>{contactNames[selectedMessage.sender_id] || 'Yükleniyor...'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Alıcı:</span>
                    <span>{contactNames[selectedMessage.receiver_id] || 'Yükleniyor...'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Tarih:</span>
                    <span>{new Date(selectedMessage.created_at).toLocaleString('tr-TR')}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {selectedMessage.sender_id === userId ? 'Alıcı' : 'Gönderen'}: {' '}
                    {contactNames[selectedMessage.sender_id === userId ? selectedMessage.receiver_id : selectedMessage.sender_id]}
                  </span>
                  <span>{new Date(selectedMessage.created_at).toLocaleString('tr-TR')}</span>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>

              <div className="flex space-x-3">
                {!(userRole === 'admin' && viewMode === 'all') && (
                  <button
                    onClick={() => handleReply(selectedMessage)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Cevapla</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedMessage(null)}
                  className={`px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors ${
                    userRole === 'admin' && viewMode === 'all' ? 'flex-1' : ''
                  }`}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {form.subject.startsWith('Re: ') ? 'Mesaj Cevapla' : 'Yeni Mesaj'}
              </h3>
              <button
                onClick={() => {
                  setShowComposeModal(false);
                  setForm({ receiver_id: '', subject: '', content: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alıcı</label>
                <select
                  required
                  value={form.receiver_id}
                  onChange={(e) => setForm({ ...form, receiver_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  disabled={form.subject.startsWith('Re: ')}
                >
                  <option value="">Alıcı seçin...</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.full_name} ({contact.role === 'admin' ? 'Yönetici' : contact.role === 'teacher' ? 'Öğretmen' : 'Veli'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konu</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Mesaj konusu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <textarea
                  required
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                  placeholder="Mesajınızı yazın..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowComposeModal(false);
                    setForm({ receiver_id: '', subject: '', content: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Gönder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
