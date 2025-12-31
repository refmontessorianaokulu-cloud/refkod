import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, Trash2, Edit2, X } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface CalendarSectionProps {
  userId: string;
  userRole: 'admin' | 'teacher' | 'parent';
}

export default function CalendarSection({ userId, userRole }: CalendarSectionProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'event',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('academic_calendar')
        .select('*')
        .order('event_date', { ascending: true });
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        const { error } = await supabase
          .from('academic_calendar')
          .update({
            ...form,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);
        if (error) throw error;
        alert('Etkinlik güncellendi!');
      } else {
        const { error } = await supabase.from('academic_calendar').insert({
          ...form,
          created_by: userId,
        });
        if (error) throw error;
        alert('Etkinlik eklendi!');
      }

      setShowModal(false);
      setEditingEvent(null);
      setForm({ title: '', description: '', event_date: '', event_type: 'event' });
      loadEvents();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu etkinliği silmek istediğinize emin misiniz?')) return;
    try {
      const { error } = await supabase.from('academic_calendar').delete().eq('id', id);
      if (error) throw error;
      loadEvents();
      alert('Etkinlik silindi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleEdit = (event: CalendarEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      event_type: event.event_type,
    });
    setShowModal(true);
  };

  const getEventTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      holiday: 'Tatil',
      exam: 'Sınav',
      event: 'Etkinlik',
      meeting: 'Toplantı',
      other: 'Diğer',
    };
    return types[type] || type;
  };

  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      holiday: 'bg-red-100 text-red-800 border-red-200',
      exam: 'bg-blue-100 text-blue-800 border-blue-200',
      event: 'bg-green-100 text-green-800 border-green-200',
      meeting: 'bg-purple-100 text-purple-800 border-purple-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[type] || colors.other;
  };

  const groupEventsByMonth = () => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const monthYear = new Date(event.event_date).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
      });
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByMonth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Akademik Takvim</h2>
        </div>
        {userRole === 'admin' && (
          <button
            onClick={() => {
              setEditingEvent(null);
              setForm({ title: '', description: '', event_date: '', event_type: 'event' });
              setShowModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            <span>Etkinlik Ekle</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz etkinlik yok</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthYear, monthEvents]) => (
            <div key={monthYear}>
              <h3 className="text-xl font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-gray-200">
                {monthYear}
              </h3>
              <div className="space-y-3">
                {monthEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`bg-white rounded-xl p-4 border hover:shadow-md transition-shadow ${getEventTypeColor(
                      event.event_type
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            {new Date(event.event_date).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getEventTypeColor(
                              event.event_type
                            )}`}
                          >
                            {getEventTypeLabel(event.event_type)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-gray-600">{event.description}</p>
                        )}
                      </div>
                      {userRole === 'admin' && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 hover:bg-white rounded-lg transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingEvent ? 'Etkinliği Düzenle' : 'Yeni Etkinlik Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingEvent(null);
                  setForm({ title: '', description: '', event_date: '', event_type: 'event' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Etkinlik başlığı..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Etkinlik açıklaması (isteğe bağlı)..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tarih</label>
                <input
                  type="date"
                  required
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Etkinlik Tipi</label>
                <select
                  required
                  value={form.event_type}
                  onChange={(e) => setForm({ ...form, event_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="event">Etkinlik</option>
                  <option value="holiday">Tatil</option>
                  <option value="exam">Sınav</option>
                  <option value="meeting">Toplantı</option>
                  <option value="other">Diğer</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingEvent(null);
                    setForm({ title: '', description: '', event_date: '', event_type: 'event' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all"
                >
                  {editingEvent ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
