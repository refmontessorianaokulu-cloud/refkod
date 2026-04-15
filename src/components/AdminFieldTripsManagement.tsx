import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, CreditCard as Edit, Trash2, Eye, MapPin, Calendar, Clock, Users, Tag } from 'lucide-react';

interface FieldTrip {
  id: string;
  title: string;
  location: string;
  trip_date: string;
  trip_time: string;
  description: string;
  class_name: string;
  deadline: string;
  is_active: boolean;
  program_type: string;
  for_parent: boolean;
  created_at: string;
}

interface ConsentWithDetails {
  id: string;
  parent_name: string;
  child_name: string;
  class_name: string;
  consent_type: string;
  updated_at: string;
}

const PROGRAM_TYPES = [
  { value: 'gezi', label: 'Gezi' },
  { value: 'ziyaret', label: 'Ziyaret' },
  { value: 'seminer', label: 'Seminer' },
  { value: 'atolye', label: 'Atölye' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'konferans', label: 'Konferans' },
  { value: 'diger', label: 'Diğer' },
];

const PROGRAM_TYPE_LABELS: Record<string, string> = {
  gezi: 'Gezi',
  ziyaret: 'Ziyaret',
  seminer: 'Seminer',
  atolye: 'Atölye',
  workshop: 'Workshop',
  konferans: 'Konferans',
  diger: 'Diğer',
};

export default function AdminFieldTripsManagement() {
  const [trips, setTrips] = useState<FieldTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState<FieldTrip | null>(null);
  const [viewingConsents, setViewingConsents] = useState<string | null>(null);
  const [consents, setConsents] = useState<ConsentWithDetails[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    location: '',
    trip_date: '',
    trip_time: '',
    description: '',
    class_name: '',
    deadline: '',
    is_active: true,
    program_type: 'gezi',
    for_parent: false,
  });

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    try {
      const { data, error } = await supabase
        .from('field_trips')
        .select('*')
        .order('trip_date', { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchConsents(tripId: string) {
    try {
      const trip = trips.find(t => t.id === tripId);
      const forParent = trip?.for_parent ?? false;

      if (forParent) {
        const { data, error } = await supabase
          .from('field_trip_consents')
          .select('id, consent_type, updated_at, parent_id')
          .eq('field_trip_id', tripId);

        if (error) throw error;

        const parentIds = [...new Set((data || []).map((c: any) => c.parent_id).filter(Boolean))];
        let profileMap: Record<string, string> = {};

        if (parentIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', parentIds);

          (profilesData || []).forEach((p: any) => {
            profileMap[p.id] = p.full_name;
          });
        }

        const formatted: ConsentWithDetails[] = (data || []).map((consent: any) => ({
          id: consent.id,
          parent_name: profileMap[consent.parent_id] || 'Bilinmiyor',
          child_name: '-',
          class_name: '-',
          consent_type: consent.consent_type,
          updated_at: consent.updated_at,
        }));

        setConsents(formatted);
      } else {
        const { data, error } = await supabase
          .from('field_trip_consents')
          .select(`
            id,
            consent_type,
            updated_at,
            children (
              id,
              first_name,
              last_name,
              class_name,
              parent_children (
                profiles (
                  full_name
                )
              )
            )
          `)
          .eq('field_trip_id', tripId);

        if (error) throw error;

        const formatted: ConsentWithDetails[] = (data || []).map((consent: any) => ({
          id: consent.id,
          parent_name: consent.children?.parent_children?.[0]?.profiles?.full_name || 'Bilinmiyor',
          child_name: `${consent.children?.first_name || ''} ${consent.children?.last_name || ''}`.trim(),
          class_name: consent.children?.class_name || '',
          consent_type: consent.consent_type,
          updated_at: consent.updated_at,
        }));

        setConsents(formatted);
      }

      setViewingConsents(tripId);
    } catch (error) {
      console.error('Error fetching consents:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const tripData = {
        title: formData.title,
        location: formData.location,
        trip_date: formData.trip_date,
        trip_time: formData.trip_time,
        description: formData.description,
        class_name: formData.class_name,
        deadline: new Date(`${formData.deadline}T23:59:59`).toISOString(),
        is_active: formData.is_active,
        program_type: formData.program_type,
        for_parent: formData.for_parent,
      };

      if (editingTrip) {
        const { error } = await supabase
          .from('field_trips')
          .update(tripData)
          .eq('id', editingTrip.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('field_trips')
          .insert([tripData]);

        if (error) throw error;
      }

      resetForm();
      fetchTrips();
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('Kayıt başarısız!');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Bu kaydı silmek istediğinize emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('field_trips')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTrips();
    } catch (error) {
      console.error('Error deleting trip:', error);
      alert('Silinemedi!');
    }
  }

  function handleEdit(trip: FieldTrip) {
    setEditingTrip(trip);
    const deadlineDate = new Date(trip.deadline);
    const formattedDeadline = deadlineDate.toISOString().split('T')[0];

    setFormData({
      title: trip.title,
      location: trip.location,
      trip_date: trip.trip_date,
      trip_time: trip.trip_time,
      description: trip.description,
      class_name: trip.class_name,
      deadline: formattedDeadline,
      is_active: trip.is_active,
      program_type: trip.program_type || 'gezi',
      for_parent: trip.for_parent || false,
    });
    setShowForm(true);
  }

  function resetForm() {
    setFormData({
      title: '',
      location: '',
      trip_date: '',
      trip_time: '',
      description: '',
      class_name: '',
      deadline: '',
      is_active: true,
      program_type: 'gezi',
      for_parent: false,
    });
    setEditingTrip(null);
    setShowForm(false);
  }

  const viewingTrip = viewingConsents ? trips.find(t => t.id === viewingConsents) : null;

  const getConsentLabel = (consentType: string, forParent: boolean) => {
    if (forParent) {
      return consentType === 'will_attend' ? 'Katılacağım' : 'Katılamayacağım';
    }
    return consentType === 'approved' ? 'Katılacak' : 'Okulda Kalacak';
  };

  const getConsentColor = (consentType: string, forParent: boolean) => {
    if (forParent) {
      return consentType === 'will_attend'
        ? 'bg-green-100 text-green-800'
        : 'bg-red-100 text-red-800';
    }
    return consentType === 'approved'
      ? 'bg-green-100 text-green-800'
      : 'bg-orange-100 text-orange-800';
  };

  const stats = viewingConsents && viewingTrip ? {
    total: consents.length,
    positive: viewingTrip.for_parent
      ? consents.filter(c => c.consent_type === 'will_attend').length
      : consents.filter(c => c.consent_type === 'approved').length,
    negative: viewingTrip.for_parent
      ? consents.filter(c => c.consent_type === 'will_not_attend').length
      : consents.filter(c => c.consent_type === 'stay_at_school').length,
  } : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gezi, Ziyaret ve Katılım Formları</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Yeni Ekle
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingTrip ? 'Düzenle' : 'Yeni Kayıt Ekle'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Başlık *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Örn: Rahmi M. Koç Müzesi Ziyareti"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Program Türü *
                </label>
                <select
                  required
                  value={formData.program_type}
                  onChange={(e) => setFormData({ ...formData, program_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  {PROGRAM_TYPES.map(pt => (
                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lokasyon *
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="Örn: Rahmi M. Koç Müzesi, Hasköy"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih *
                </label>
                <input
                  type="date"
                  required
                  value={formData.trip_date}
                  onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saat *
                </label>
                <input
                  type="time"
                  required
                  value={formData.trip_time}
                  onChange={(e) => setFormData({ ...formData, trip_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sınıf *
                </label>
                <select
                  required
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Sınıf Seçin</option>
                  <option value="Tüm Sınıflar">Tüm Sınıflar</option>
                  <option value="3 Yaş Sınıfı">3 Yaş Sınıfı</option>
                  <option value="3 Yaş Yarım Gün Sınıfı">3 Yaş Yarım Gün Sınıfı</option>
                  <option value="4 Yaş Sınıfı">4 Yaş Sınıfı</option>
                  <option value="5 Yaş Sınıfı">5 Yaş Sınıfı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Onay Son Tarihi *
                </label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Aktif</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Etkinlik hakkında detaylı bilgi..."
              />
            </div>

            <div className="border border-teal-200 bg-teal-50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.for_parent}
                  onChange={(e) => setFormData({ ...formData, for_parent: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div>
                  <span className="text-sm font-semibold text-teal-800">Bu form veli katılımı içindir</span>
                  <p className="text-xs text-teal-600 mt-0.5">
                    İşaretlenirse veliler çocukları adına değil, kendileri adına yanıt verir.
                    Seçenekler <strong>"Katılacağım"</strong> veya <strong>"Katılamayacağım"</strong> olarak gösterilir.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                {editingTrip ? 'Güncelle' : 'Kaydet'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {viewingConsents && stats && viewingTrip && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Onay Durumları</h3>
              <p className="text-sm text-gray-500 mt-0.5">{viewingTrip.title}</p>
            </div>
            <button
              onClick={() => {
                setViewingConsents(null);
                setConsents([]);
              }}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Kapat
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-blue-600">Toplam Yanıt</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.positive}</div>
              <div className="text-sm text-green-600">{viewingTrip.for_parent ? 'Katılacağım' : 'Katılacak'}</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.negative}</div>
              <div className="text-sm text-orange-600">{viewingTrip.for_parent ? 'Katılamayacağım' : 'Okulda Kalacak'}</div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Veli Adı Soyadı
                  </th>
                  {!viewingTrip.for_parent && (
                    <>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Çocuk Adı Soyadı
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sınıf
                      </th>
                    </>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onay Durumu
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Güncelleme Tarihi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {consents.map((consent) => (
                  <tr key={consent.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{consent.parent_name}</td>
                    {!viewingTrip.for_parent && (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-900">{consent.child_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{consent.class_name}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConsentColor(consent.consent_type, viewingTrip.for_parent)}`}>
                        {getConsentLabel(consent.consent_type, viewingTrip.for_parent)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(consent.updated_at).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))}
                {consents.length === 0 && (
                  <tr>
                    <td colSpan={viewingTrip.for_parent ? 3 : 5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      Henüz yanıt verilmemiş.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {trips.map((trip) => (
          <div
            key={trip.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900">{trip.title}</h3>
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs font-medium rounded-full flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {PROGRAM_TYPE_LABELS[trip.program_type] || trip.program_type}
                  </span>
                  {trip.for_parent && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      Veli Katılımı
                    </span>
                  )}
                  {trip.is_active ? (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      Aktif
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                      Pasif
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{trip.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(trip.trip_date).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{trip.trip_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Sınıf: {trip.class_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Son Onay: {new Date(trip.deadline).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                {trip.description && (
                  <p className="mt-2 text-sm text-gray-600">{trip.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => fetchConsents(trip.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Onayları Görüntüle"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleEdit(trip)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Düzenle"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(trip.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {trips.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Henüz kayıt eklenmemiş. Yeni eklemek için yukarıdaki butonu kullanın.
          </div>
        )}
      </div>
    </div>
  );
}
