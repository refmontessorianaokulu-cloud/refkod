import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    const days: Date[] = [];

    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    for (let i = adjustedStart; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter((event) => event.event_date === dateString);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    if (userRole === 'admin') {
      setEditingEvent(null);
      setForm({
        title: '',
        description: '',
        event_date: date.toISOString().split('T')[0],
        event_type: 'event',
      });
      setShowModal(true);
    }
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const days = getDaysInMonth(currentDate);
  const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Akademik Takvim</h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-semibold">
              {currentDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : (
          <>
            <div className="grid grid-cols-7 border-b border-gray-200">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold text-gray-700 bg-gray-50"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isCurrent = isCurrentMonth(day);
                const isTodayDate = isToday(day);

                return (
                  <div
                    key={index}
                    onClick={() => isCurrent && handleDayClick(day)}
                    className={`min-h-24 p-2 border-b border-r border-gray-200 ${
                      isCurrent
                        ? userRole === 'admin'
                          ? 'cursor-pointer hover:bg-blue-50'
                          : 'bg-white'
                        : 'bg-gray-50'
                    } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        isTodayDate
                          ? 'bg-blue-500 text-white w-7 h-7 rounded-full flex items-center justify-center'
                          : isCurrent
                          ? 'text-gray-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={`text-xs px-2 py-1 rounded cursor-pointer hover:opacity-80 transition-opacity truncate ${
                            event.event_type === 'holiday'
                              ? 'bg-red-100 text-red-800'
                              : event.event_type === 'exam'
                              ? 'bg-blue-100 text-blue-800'
                              : event.event_type === 'event'
                              ? 'bg-green-100 text-green-800'
                              : event.event_type === 'meeting'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showEventDetail && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Etkinlik Detayı</h3>
              <button
                onClick={() => {
                  setShowEventDetail(false);
                  setSelectedEvent(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span
                  className={`inline-block text-xs px-3 py-1 rounded-full ${getEventTypeColor(
                    selectedEvent.event_type
                  )}`}
                >
                  {getEventTypeLabel(selectedEvent.event_type)}
                </span>
              </div>

              <div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">{selectedEvent.title}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(selectedEvent.event_date).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {selectedEvent.description && (
                <div>
                  <p className="text-gray-700">{selectedEvent.description}</p>
                </div>
              )}

              {userRole === 'admin' && (
                <div className="flex space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleEdit(selectedEvent);
                      setShowEventDetail(false);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={() => {
                      setShowEventDetail(false);
                      handleDelete(selectedEvent.id);
                    }}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Sil
                  </button>
                </div>
              )}
            </div>
          </div>
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
