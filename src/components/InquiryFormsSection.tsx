import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, CheckCircle, X, Eye } from 'lucide-react';

interface InquiryForm {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  child_name: string;
  child_age: number;
  message: string;
  status: 'pending' | 'contacted' | 'completed';
  responded_by: string | null;
  response_notes: string;
  created_at: string;
  updated_at: string;
}

export default function InquiryFormsSection() {
  const [forms, setForms] = useState<InquiryForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState<InquiryForm | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [responseNotes, setResponseNotes] = useState('');

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('inquiry_forms')
        .select('*')
        .order('created_at', { ascending: false });
      setForms(data || []);
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'pending' | 'contacted' | 'completed') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('inquiry_forms')
        .update({
          status,
          responded_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      loadForms();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleViewForm = (form: InquiryForm) => {
    setSelectedForm(form);
    setResponseNotes(form.response_notes || '');
    setShowModal(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedForm) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('inquiry_forms')
        .update({
          response_notes: responseNotes,
          responded_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedForm.id);

      if (error) throw error;

      alert('Notlar kaydedildi!');
      setShowModal(false);
      loadForms();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Beklemede';
      case 'contacted':
        return 'İletişim Kuruldu';
      case 'completed':
        return 'Tamamlandı';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-xl">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Ön Bilgi Talep Formları</h2>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz form gönderisi yok</div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Tarih
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Veli Adı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  İletişim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Çocuk Bilgisi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Date(form.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{form.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{form.email}</div>
                    <div className="text-sm text-gray-500">{form.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">{form.child_name}</div>
                    <div className="text-sm text-gray-500">{form.child_age} yaşında</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(form.status)}`}>
                      {getStatusLabel(form.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button
                      onClick={() => handleViewForm(form)}
                      className="inline-flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Görüntüle
                    </button>
                    {form.status !== 'completed' && (
                      <button
                        onClick={() => handleStatusChange(form.id, form.status === 'pending' ? 'contacted' : 'completed')}
                        className="inline-flex items-center px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {form.status === 'pending' ? 'İletişim Kuruldu' : 'Tamamla'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Form Detayları</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Veli Adı</label>
                  <p className="text-gray-900">{selectedForm.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedForm.status)}`}>
                    {getStatusLabel(selectedForm.status)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                  <p className="text-gray-900">{selectedForm.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                  <p className="text-gray-900">{selectedForm.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Çocuk Adı</label>
                  <p className="text-gray-900">{selectedForm.child_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yaş</label>
                  <p className="text-gray-900">{selectedForm.child_age}</p>
                </div>
              </div>

              {selectedForm.message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mesaj</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedForm.message}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yanıt Notları</label>
                <textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Görüşme notları, yapılan iletişim detayları..."
                />
              </div>

              <div className="text-sm text-gray-500">
                <p>Gönderim: {new Date(selectedForm.created_at).toLocaleString('tr-TR')}</p>
                <p>Güncelleme: {new Date(selectedForm.updated_at).toLocaleString('tr-TR')}</p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Kapat
                </button>
                <button
                  onClick={handleSaveNotes}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  Notları Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
