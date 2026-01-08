import { useState, useEffect } from 'react';
import { supabase, MaterialRequest } from '../lib/supabase';
import { Package, Plus, X, CheckCircle, XCircle, Clock } from 'lucide-react';

interface MaterialRequestsSectionProps {
  userId: string;
  userRole: 'admin' | 'teacher' | 'staff';
  staffRole?: 'cook' | 'cleaning_staff' | 'bus_driver' | 'security_staff' | 'toilet_attendant' | 'other' | null;
}

export default function MaterialRequestsSection({ userId, userRole }: MaterialRequestsSectionProps) {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequest | null>(null);
  const [requesterNames, setRequesterNames] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    quantity: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const [adminForm, setAdminForm] = useState({
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'completed',
    admin_notes: '',
  });

  useEffect(() => {
    loadRequests();
  }, [userId, userRole]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('material_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (userRole !== 'admin') {
        query = query.eq('requester_id', userId);
      }

      const { data } = await query;
      setRequests(data || []);

      if (data && data.length > 0) {
        const uniqueRequesterIds = [...new Set(data.map(r => r.requester_id))];
        const names: Record<string, string> = {};

        for (const id of uniqueRequesterIds) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', id)
            .maybeSingle();

          if (profile) {
            names[id] = profile.full_name;
          }
        }

        setRequesterNames(names);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const requestType = userRole === 'teacher' ? 'material' : 'supply';

      const { error } = await supabase.from('material_requests').insert({
        requester_id: userId,
        request_type: requestType,
        ...form,
      });

      if (error) throw error;

      setShowModal(false);
      setForm({ title: '', description: '', quantity: '', priority: 'medium' });
      loadRequests();
      alert('Talep başarıyla oluşturuldu!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleAdminUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('material_requests')
        .update({
          status: adminForm.status,
          admin_notes: adminForm.admin_notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      setSelectedRequest(null);
      setAdminForm({ status: 'pending', admin_notes: '' });
      loadRequests();
      alert('Talep güncellendi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu talebi silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('material_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;

      loadRequests();
      alert('Talep silindi!');
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Beklemede' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Onaylandı' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Reddedildi' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle, label: 'Tamamlandı' },
    };
    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        <span>{badge.label}</span>
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Düşük' },
      medium: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Orta' },
      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Yüksek' },
      urgent: { bg: 'bg-red-100', text: 'text-red-800', label: 'Acil' },
    };
    const badge = badges[priority as keyof typeof badges];
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const getRequestTypeLabel = (type: string) => {
    return type === 'material' ? 'Materyal' : 'Malzeme';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-xl">
            <Package className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {userRole === 'admin' ? 'Tüm Talepler' : userRole === 'teacher' ? 'Materyal Talepleri' : 'Malzeme Talepleri'}
          </h2>
        </div>
        {userRole !== 'admin' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-lg hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Talep</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz talep yok</div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">{request.title}</h3>
                    {getStatusBadge(request.status)}
                    {getPriorityBadge(request.priority)}
                  </div>
                  {userRole === 'admin' && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span className="font-medium">
                        Talep Eden: {requesterNames[request.requester_id] || 'Yükleniyor...'}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {getRequestTypeLabel(request.request_type)}
                      </span>
                    </div>
                  )}
                  <p className="text-gray-600 mb-2">{request.description}</p>
                  {request.quantity && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Miktar:</span> {request.quantity}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                    <span>Oluşturulma: {new Date(request.created_at).toLocaleDateString('tr-TR')}</span>
                    {request.updated_at !== request.created_at && (
                      <span>Güncellenme: {new Date(request.updated_at).toLocaleDateString('tr-TR')}</span>
                    )}
                  </div>
                  {request.admin_notes && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <span className="font-semibold">Yönetici Notu:</span> {request.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  {userRole === 'admin' ? (
                    <button
                      onClick={() => {
                        setSelectedRequest(request);
                        setAdminForm({
                          status: request.status,
                          admin_notes: request.admin_notes,
                        });
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all text-sm"
                    >
                      Düzenle
                    </button>
                  ) : (
                    request.status === 'pending' && (
                      <button
                        onClick={() => handleDelete(request.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        Sil
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Yeni {userRole === 'teacher' ? 'Materyal' : 'Malzeme'} Talebi
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setForm({ title: '', description: '', quantity: '', priority: 'medium' });
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Talep başlığı..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Talep detayları..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Miktar (Opsiyonel)</label>
                <input
                  type="text"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Örn: 10 adet, 2 paket..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Yüksek</option>
                  <option value="urgent">Acil</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ title: '', description: '', quantity: '', priority: 'medium' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all"
                >
                  Talep Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Talebi Düzenle</h3>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminForm({ status: 'pending', admin_notes: '' });
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">{selectedRequest.title}</h4>
              <p className="text-gray-600 mb-2">{selectedRequest.description}</p>
              {selectedRequest.quantity && (
                <p className="text-sm text-gray-500">Miktar: {selectedRequest.quantity}</p>
              )}
            </div>

            <form onSubmit={handleAdminUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Durum</label>
                <select
                  value={adminForm.status}
                  onChange={(e) => setAdminForm({ ...adminForm, status: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="pending">Beklemede</option>
                  <option value="approved">Onaylandı</option>
                  <option value="rejected">Reddedildi</option>
                  <option value="completed">Tamamlandı</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yönetici Notu</label>
                <textarea
                  value={adminForm.admin_notes}
                  onChange={(e) => setAdminForm({ ...adminForm, admin_notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  placeholder="Not ekleyin..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRequest(null);
                    setAdminForm({ status: 'pending', admin_notes: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
