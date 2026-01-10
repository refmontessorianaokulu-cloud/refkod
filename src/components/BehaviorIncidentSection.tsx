import { useState, useEffect } from 'react';
import { supabase, BehaviorIncident, Profile, Child } from '../lib/supabase';
import { ClipboardList, Plus, Edit2, Trash2, Calendar, Clock, MapPin, User, FileText, CheckCircle, AlertCircle, X, Save, Baby } from 'lucide-react';

interface Props {
  userId: string;
  userRole: 'admin' | 'teacher' | 'guidance_counselor' | 'staff';
}

export default function BehaviorIncidentSection({ userId, userRole }: Props) {
  const [incidents, setIncidents] = useState<BehaviorIncident[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<BehaviorIncident | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [evaluationFilter, setEvaluationFilter] = useState<string>('all');
  const [childFilter, setChildFilter] = useState<string>('');
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);

  const [incidentForm, setIncidentForm] = useState({
    child_id: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: new Date().toTimeString().slice(0, 5),
    location: '',
    summary: '',
  });

  const [evaluationForm, setEvaluationForm] = useState({
    guidance_evaluation: '',
  });

  const canCreate = true;
  const canEdit = userRole === 'admin';
  const canDelete = userRole === 'admin';
  const canEvaluate = userRole === 'guidance_counselor' || userRole === 'admin';
  const canViewAll = userRole === 'admin' || userRole === 'teacher' || userRole === 'guidance_counselor';

  useEffect(() => {
    loadChildren();
    loadIncidents();

    const channel = supabase
      .channel('behavior_incidents_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'behavior_incidents' }, () => {
        loadIncidents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadChildren = async () => {
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('behavior_incidents')
        .select(`
          *,
          creator:profiles!created_by(full_name, email, role),
          evaluator:profiles!evaluated_by(full_name, email),
          child:children(id, first_name, last_name, class_name)
        `)
        .order('incident_date', { ascending: false })
        .order('incident_time', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!incidentForm.child_id) {
      alert('Lütfen bir öğrenci seçin');
      return;
    }

    try {
      const { error } = await supabase.from('behavior_incidents').insert({
        child_id: incidentForm.child_id,
        incident_date: incidentForm.incident_date,
        incident_time: incidentForm.incident_time,
        location: incidentForm.location,
        summary: incidentForm.summary,
        created_by: userId,
      });

      if (error) throw error;

      setShowCreateModal(false);
      setIncidentForm({
        child_id: '',
        incident_date: new Date().toISOString().split('T')[0],
        incident_time: new Date().toTimeString().slice(0, 5),
        location: '',
        summary: '',
      });
      loadIncidents();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleUpdateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    if (!incidentForm.child_id) {
      alert('Lütfen bir öğrenci seçin');
      return;
    }

    try {
      const { error } = await supabase
        .from('behavior_incidents')
        .update({
          child_id: incidentForm.child_id,
          incident_date: incidentForm.incident_date,
          incident_time: incidentForm.incident_time,
          location: incidentForm.location,
          summary: incidentForm.summary,
        })
        .eq('id', selectedIncident.id);

      if (error) throw error;

      setShowEditModal(false);
      setSelectedIncident(null);
      loadIncidents();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDeleteIncident = async (incidentId: string) => {
    if (!confirm('Bu olay kaydını silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('behavior_incidents')
        .delete()
        .eq('id', incidentId);

      if (error) throw error;
      loadIncidents();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleAddEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    try {
      const { error } = await supabase
        .from('behavior_incidents')
        .update({
          guidance_evaluation: evaluationForm.guidance_evaluation,
          evaluated_by: userId,
          evaluated_at: new Date().toISOString(),
        })
        .eq('id', selectedIncident.id);

      if (error) throw error;

      setShowEvaluationModal(false);
      setSelectedIncident(null);
      setEvaluationForm({ guidance_evaluation: '' });
      loadIncidents();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const openEditModal = (incident: BehaviorIncident) => {
    setSelectedIncident(incident);
    setIncidentForm({
      child_id: incident.child_id || '',
      incident_date: incident.incident_date,
      incident_time: incident.incident_time,
      location: incident.location,
      summary: incident.summary,
    });
    setShowEditModal(true);
  };

  const openEvaluationModal = (incident: BehaviorIncident) => {
    setSelectedIncident(incident);
    setEvaluationForm({
      guidance_evaluation: incident.guidance_evaluation || '',
    });
    setShowEvaluationModal(true);
  };

  const filteredIncidents = incidents.filter((incident) => {
    if (dateFilter && incident.incident_date !== dateFilter) return false;
    if (locationFilter && !incident.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
    if (evaluationFilter === 'evaluated' && !incident.guidance_evaluation) return false;
    if (evaluationFilter === 'pending' && incident.guidance_evaluation) return false;
    if (childFilter && incident.child_id !== childFilter) return false;
    return true;
  });

  const stats = {
    total: incidents.length,
    pending: incidents.filter(i => !i.guidance_evaluation).length,
    evaluated: incidents.filter(i => i.guidance_evaluation).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-blue-600" />
            KOD - Olay Kayıtları
          </h2>
          <p className="text-sm text-gray-600 mt-1">Kayıt Oluşturulan Davranış</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            Yeni Olay Kaydı
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Toplam Kayıt</p>
              <p className="text-3xl font-bold text-blue-700">{stats.total}</p>
            </div>
            <ClipboardList className="w-12 h-12 text-blue-300" />
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Değerlendirme Bekleyen</p>
              <p className="text-3xl font-bold text-yellow-700">{stats.pending}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-yellow-300" />
          </div>
        </div>

        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Değerlendirilmiş</p>
              <p className="text-3xl font-bold text-green-700">{stats.evaluated}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-300" />
          </div>
        </div>
      </div>

      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Filtreler</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Öğrenci</label>
            <select
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tümü</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name} - {child.class_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konum</label>
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Konum ara..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Değerlendirme Durumu</label>
            <select
              value={evaluationFilter}
              onChange={(e) => setEvaluationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tümü</option>
              <option value="pending">Değerlendirme Bekleyen</option>
              <option value="evaluated">Değerlendirilmiş</option>
            </select>
          </div>
        </div>
        {(dateFilter || locationFilter || evaluationFilter !== 'all' || childFilter) && (
          <button
            onClick={() => {
              setDateFilter('');
              setLocationFilter('');
              setEvaluationFilter('all');
              setChildFilter('');
            }}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700"
          >
            Filtreleri Temizle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-gray-200">
            <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Henüz olay kaydı bulunmuyor</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`bg-white border-2 rounded-lg p-5 transition ${
                incident.guidance_evaluation
                  ? 'border-green-200 hover:border-green-300'
                  : 'border-yellow-200 hover:border-yellow-300'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        incident.guidance_evaluation
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {incident.guidance_evaluation ? 'Değerlendirildi' : 'Değerlendirme Bekliyor'}
                    </span>
                    {incident.child && (
                      <div className="flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                        <Baby className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {incident.child.first_name} {incident.child.last_name} - {incident.child.class_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(incident.incident_date).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>{incident.incident_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{incident.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {canEvaluate && (
                    <button
                      onClick={() => openEvaluationModal(incident)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Değerlendirme Ekle/Düzenle"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(incident)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      title="Düzenle"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteIncident(incident.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Sil"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <h4 className="font-medium text-gray-800 mb-1">Olay Özeti:</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{incident.summary}</p>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <User className="w-4 h-4" />
                <span>
                  Kayıt: {incident.creator?.full_name || 'Bilinmiyor'} ({new Date(incident.created_at).toLocaleDateString('tr-TR')} {new Date(incident.created_at).toLocaleTimeString('tr-TR')})
                </span>
              </div>

              {incident.guidance_evaluation && (
                <div className="mt-4 pt-4 border-t-2 border-green-100">
                  <button
                    onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                    className="w-full text-left font-medium text-green-700 hover:text-green-800 flex items-center justify-between transition"
                  >
                    <span>Rehberlik Değerlendirmesi</span>
                    <span>{expandedIncident === incident.id ? '▼' : '▶'}</span>
                  </button>
                  {expandedIncident === incident.id && (
                    <div className="mt-3 bg-green-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap mb-3">{incident.guidance_evaluation}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>
                          Değerlendiren: {incident.evaluator?.full_name || 'Bilinmiyor'} - {new Date(incident.evaluated_at!).toLocaleDateString('tr-TR')} {new Date(incident.evaluated_at!).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Yeni Olay Kaydı</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateIncident} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öğrenci *
                </label>
                <select
                  value={incidentForm.child_id}
                  onChange={(e) => setIncidentForm({ ...incidentForm, child_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Öğrenci Seçin</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name} - {child.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Olay Tarihi *
                  </label>
                  <input
                    type="date"
                    value={incidentForm.incident_date}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incident_date: e.target.value })}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Olay Saati *
                  </label>
                  <input
                    type="time"
                    value={incidentForm.incident_time}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incident_time: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konum *
                </label>
                <input
                  type="text"
                  value={incidentForm.location}
                  onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  required
                  placeholder="Örn: Bahçe, Sınıf A, Yemekhane..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Olay Özeti *
                </label>
                <textarea
                  value={incidentForm.summary}
                  onChange={(e) => setIncidentForm({ ...incidentForm, summary: e.target.value })}
                  required
                  rows={6}
                  placeholder="Olayı detaylı şekilde açıklayın..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Olay Kaydını Düzenle</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateIncident} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Öğrenci *
                </label>
                <select
                  value={incidentForm.child_id}
                  onChange={(e) => setIncidentForm({ ...incidentForm, child_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Öğrenci Seçin</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name} - {child.class_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Olay Tarihi *
                  </label>
                  <input
                    type="date"
                    value={incidentForm.incident_date}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incident_date: e.target.value })}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Olay Saati *
                  </label>
                  <input
                    type="time"
                    value={incidentForm.incident_time}
                    onChange={(e) => setIncidentForm({ ...incidentForm, incident_time: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Konum *
                </label>
                <input
                  type="text"
                  value={incidentForm.location}
                  onChange={(e) => setIncidentForm({ ...incidentForm, location: e.target.value })}
                  required
                  placeholder="Örn: Bahçe, Sınıf A, Yemekhane..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Olay Özeti *
                </label>
                <textarea
                  value={incidentForm.summary}
                  onChange={(e) => setIncidentForm({ ...incidentForm, summary: e.target.value })}
                  required
                  rows={6}
                  placeholder="Olayı detaylı şekilde açıklayın..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Güncelle
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEvaluationModal && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Rehberlik Değerlendirmesi</h3>
              <button
                onClick={() => setShowEvaluationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedIncident.incident_date).toLocaleDateString('tr-TR')} - {selectedIncident.incident_time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedIncident.location}</span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Olay Özeti:</p>
                  <p className="text-sm text-gray-600">{selectedIncident.summary}</p>
                </div>
              </div>

              <form onSubmit={handleAddEvaluation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rehberlik Görüşü ve Değerlendirme *
                  </label>
                  <textarea
                    value={evaluationForm.guidance_evaluation}
                    onChange={(e) => setEvaluationForm({ ...evaluationForm, guidance_evaluation: e.target.value })}
                    required
                    rows={8}
                    placeholder="Olayla ilgili profesyonel görüş ve değerlendirmenizi yazın..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {selectedIncident.guidance_evaluation ? 'Güncelle' : 'Kaydet'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEvaluationModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
