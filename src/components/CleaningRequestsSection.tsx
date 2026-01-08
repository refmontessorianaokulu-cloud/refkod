import { useState, useEffect } from 'react';
import { supabase, CleaningRequest, Profile } from '../lib/supabase';
import { Sparkles, CheckCircle, Clock, MapPin } from 'lucide-react';

interface Props {
  userId: string;
  userRole: 'admin' | 'teacher' | 'guidance_counselor' | 'staff';
}

export default function CleaningRequestsSection({ userId, userRole }: Props) {
  const [requests, setRequests] = useState<(CleaningRequest & { requester?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({
    location: '',
    description: '',
    urgency: 'medium' as 'low' | 'medium' | 'high',
  });

  const canCreateRequest = userRole === 'admin' || userRole === 'teacher' || userRole === 'guidance_counselor';
  const canUpdateRequest = userRole === 'staff' || userRole === 'admin';

  useEffect(() => {
    loadRequests();

    const channel = supabase
      .channel('cleaning_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaning_requests' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('cleaning_requests')
        .select(`
          *,
          requester:profiles!requested_by(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('cleaning_requests').insert({
        location: newRequest.location,
        description: newRequest.description,
        urgency: newRequest.urgency,
        requested_by: userId,
        status: 'pending',
      });

      if (error) throw error;

      setShowCreateModal(false);
      setNewRequest({ location: '', description: '', urgency: 'medium' });
      loadRequests();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'pending' | 'in_progress' | 'completed') => {
    try {
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'in_progress') {
        updateData.assigned_to = userId;
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('cleaning_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;
      loadRequests();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (urgency === 'medium') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getUrgencyLabel = (urgency: string) => {
    if (urgency === 'high') return 'Acil';
    if (urgency === 'medium') return 'Orta';
    return 'Düşük';
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'in_progress') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Tamamlandı';
    if (status === 'in_progress') return 'Devam Ediyor';
    return 'Bekliyor';
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Temizlik İstekleri</h2>
          <p className="text-sm text-gray-600 mt-1">
            Acil temizlik gerektiren alanlar için istekler
          </p>
        </div>
        {canCreateRequest && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
          >
            <Sparkles className="w-5 h-5" />
            <span>Yeni İstek</span>
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p>Henüz temizlik isteği yok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{request.location}</h3>
                  </div>
                  <p className="text-gray-700 mb-3">{request.description}</p>
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(request.urgency)}`}>
                      {getUrgencyLabel(request.urgency)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {getStatusLabel(request.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>İstek Sahibi: {request.requester?.full_name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(request.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>

                {canUpdateRequest && request.status !== 'completed' && (
                  <div className="flex space-x-2">
                    {request.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Başla</span>
                      </button>
                    )}
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateStatus(request.id, 'completed')}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Tamamla</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Yeni Temizlik İsteği</h3>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Konum</label>
                <input
                  type="text"
                  required
                  value={newRequest.location}
                  onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  placeholder="Örn: 2. Kat Koridor"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Açıklama</label>
                <textarea
                  required
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Temizlik detaylarını açıklayın..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Öncelik</label>
                <select
                  value={newRequest.urgency}
                  onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Düşük</option>
                  <option value="medium">Orta</option>
                  <option value="high">Acil</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
                >
                  Gönder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
