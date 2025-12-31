import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, X, Send, Check, Clock, AlertCircle, Bell } from 'lucide-react';

interface TuitionFee {
  id: string;
  child_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue';
  academic_year: string;
  month: string | null;
  payment_type: 'education' | 'stationery' | 'meal';
  notes: string;
  children?: {
    first_name: string;
    last_name: string;
  };
}

interface PaymentReminder {
  id: string;
  parent_id: string;
  fee_id: string | null;
  message: string;
  is_read: boolean;
  sent_at: string;
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
}

interface Parent {
  id: string;
  full_name: string;
  email: string;
}

interface FeesSectionProps {
  userId: string;
  userRole: 'admin' | 'parent';
}

export default function FeesSection({ userId, userRole }: FeesSectionProps) {
  const [fees, setFees] = useState<TuitionFee[]>([]);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFee, setSelectedFee] = useState<TuitionFee | null>(null);
  const [sendToAll, setSendToAll] = useState(true);
  const [bulkAdd, setBulkAdd] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [form, setForm] = useState({
    child_id: '',
    amount: '',
    due_date: '',
    status: 'pending',
    academic_year: '2024-2025',
    month: '',
    payment_type: 'education',
    notes: '',
  });
  const [reminderForm, setReminderForm] = useState({
    message: '',
    parent_ids: [] as string[],
  });

  useEffect(() => {
    loadFees();
    loadReminders();
    if (userRole === 'admin') {
      loadChildren();
      loadParents();
    }
  }, [userId, userRole]);

  const loadFees = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tuition_fees')
        .select('*, children(first_name, last_name)')
        .order('due_date', { ascending: true });
      setFees(data || []);
    } catch (error) {
      console.error('Error loading fees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReminders = async () => {
    try {
      const { data } = await supabase
        .from('payment_reminders')
        .select('*')
        .order('sent_at', { ascending: false });
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const loadChildren = async () => {
    try {
      const { data } = await supabase.from('children').select('*').order('first_name');
      setChildren(data || []);
    } catch (error) {
      console.error('Error loading children:', error);
    }
  };

  const loadParents = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'parent')
        .eq('approved', true)
        .order('full_name');
      setParents(data || []);
    } catch (error) {
      console.error('Error loading parents:', error);
    }
  };

  const handleSubmitFee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedFee) {
        const { error } = await supabase
          .from('tuition_fees')
          .update({
            ...form,
            amount: parseFloat(form.amount),
            month: form.payment_type === 'stationery' ? 'Yıllık' : form.month,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedFee.id);
        if (error) throw error;
        alert('Ödeme güncellendi!');
      } else {
        if (bulkAdd && selectedMonths.length > 0 && (form.payment_type === 'education' || form.payment_type === 'meal')) {
          const payments = selectedMonths.map((month, index) => {
            const dueDate = new Date(form.due_date);
            dueDate.setMonth(dueDate.getMonth() + index);
            return {
              child_id: form.child_id,
              amount: parseFloat(form.amount),
              due_date: dueDate.toISOString().split('T')[0],
              status: form.status,
              academic_year: form.academic_year,
              month: month,
              payment_type: form.payment_type,
              notes: form.notes,
              created_by: userId,
            };
          });
          const { error } = await supabase.from('tuition_fees').insert(payments);
          if (error) throw error;
          alert(`${selectedMonths.length} aylık ödeme başarıyla eklendi!`);
        } else {
          const { error } = await supabase.from('tuition_fees').insert({
            ...form,
            amount: parseFloat(form.amount),
            month: form.payment_type === 'stationery' ? 'Yıllık' : form.month,
            created_by: userId,
          });
          if (error) throw error;
          alert('Ödeme eklendi!');
        }
      }
      setShowFeeModal(false);
      setSelectedFee(null);
      resetForm();
      setBulkAdd(false);
      setSelectedMonths([]);
      loadFees();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleSendReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parentIds = sendToAll
        ? await getAllParentIds()
        : reminderForm.parent_ids;

      const reminders = parentIds.map((parentId) => ({
        parent_id: parentId,
        message: reminderForm.message,
        created_by: userId,
      }));

      if (parentIds.length === 0) {
        alert('Lütfen en az bir veli seçin!');
        return;
      }

      const { error } = await supabase.from('payment_reminders').insert(reminders);
      if (error) throw error;
      alert(`Hatırlatma ${parentIds.length} veliye gönderildi!`);
      setShowReminderModal(false);
      setReminderForm({ message: '', parent_ids: [] });
      setSendToAll(true);
      loadReminders();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const getAllParentIds = async () => {
    const { data } = await supabase.from('profiles').select('id').eq('role', 'parent');
    return data?.map((p) => p.id) || [];
  };

  const markAsRead = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from('payment_reminders')
        .update({ is_read: true })
        .eq('id', reminderId);
      if (error) throw error;
      loadReminders();
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const updateFeeStatus = async (feeId: string, status: string, paidDate?: string) => {
    try {
      const updateData: any = { status };
      if (paidDate) updateData.paid_date = paidDate;
      const { error } = await supabase.from('tuition_fees').update(updateData).eq('id', feeId);
      if (error) throw error;
      loadFees();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const resetForm = () => {
    setForm({
      child_id: '',
      amount: '',
      due_date: '',
      status: 'pending',
      academic_year: '2024-2025',
      month: '',
      payment_type: 'education',
      notes: '',
    });
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const allMonths = ['Eylül', 'Ekim', 'Kasım', 'Aralık', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'];

  const getPaymentTypeLabel = (type: string) => {
    const labels = {
      education: 'Eğitim Ödemesi',
      stationery: 'Kırtasiye Ödemesi',
      meal: 'Yemek Ödemesi',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getPaymentTypeColor = (type: string) => {
    const colors = {
      education: 'bg-blue-100 text-blue-800',
      stationery: 'bg-purple-100 text-purple-800',
      meal: 'bg-orange-100 text-orange-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      paid: <Check className="w-4 h-4" />,
      overdue: <AlertCircle className="w-4 h-4" />,
    };
    return icons[status as keyof typeof icons];
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Beklemede',
      paid: 'Ödendi',
      overdue: 'Gecikmiş',
    };
    return labels[status as keyof typeof labels] || status;
  };

  const unreadCount = reminders.filter((r) => !r.is_read).length;

  const toggleParent = (parentId: string) => {
    setReminderForm((prev) => {
      const isSelected = prev.parent_ids.includes(parentId);
      return {
        ...prev,
        parent_ids: isSelected
          ? prev.parent_ids.filter((id) => id !== parentId)
          : [...prev.parent_ids, parentId],
      };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-2 rounded-xl">
            <span className="text-2xl font-bold text-white">₺</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Okul Ödemeleri</h2>
            {userRole === 'parent' && unreadCount > 0 && (
              <span className="text-sm text-red-600">{unreadCount} okunmamış bildirim</span>
            )}
          </div>
        </div>
        {userRole === 'admin' && (
          <div className="flex space-x-2">
            <button
              onClick={() => setShowReminderModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              <Bell className="w-5 h-5" />
              <span>Hatırlatma Gönder</span>
            </button>
            <button
              onClick={() => {
                setSelectedFee(null);
                resetForm();
                setBulkAdd(false);
                setSelectedMonths([]);
                setShowFeeModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition-shadow"
            >
              <Plus className="w-5 h-5" />
              <span>Ödeme Ekle</span>
            </button>
          </div>
        )}
      </div>

      {userRole === 'parent' && reminders.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600" />
            Bildirimler
          </h3>
          <div className="space-y-2">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`p-3 rounded-lg ${
                  reminder.is_read ? 'bg-white' : 'bg-blue-100 border border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm text-gray-700 flex-1">{reminder.message}</p>
                  {!reminder.is_read && (
                    <button
                      onClick={() => markAsRead(reminder.id)}
                      className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      Okundu
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(reminder.sent_at).toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
      ) : fees.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Henüz ödeme kaydı yok</div>
      ) : (
        <div className="grid gap-4">
          {fees.map((fee) => (
            <div key={fee.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {fee.children && (
                    <h4 className="font-semibold text-gray-800 mb-1">
                      {fee.children.first_name} {fee.children.last_name}
                    </h4>
                  )}
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getPaymentTypeColor(fee.payment_type)}`}>
                      <span>{getPaymentTypeLabel(fee.payment_type)}</span>
                    </span>
                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(fee.status)}`}>
                      {getStatusIcon(fee.status)}
                      <span>{getStatusLabel(fee.status)}</span>
                    </span>
                    {fee.month && <span className="text-sm text-gray-600">{fee.month}</span>}
                    <span className="text-sm text-gray-500">({fee.academic_year})</span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="font-semibold text-green-600">{fee.amount.toFixed(2)} TL</span>
                    <span>
                      Son Tarih:{' '}
                      {new Date(fee.due_date).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                    {fee.paid_date && (
                      <span className="text-green-600">
                        Ödendi:{' '}
                        {new Date(fee.paid_date).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    )}
                  </div>
                  {fee.notes && <p className="text-sm text-gray-600 mt-2">{fee.notes}</p>}
                </div>
                {userRole === 'admin' && (
                  <div className="flex space-x-2 ml-4">
                    {fee.status === 'pending' && (
                      <button
                        onClick={() => updateFeeStatus(fee.id, 'paid', new Date().toISOString().split('T')[0])}
                        className="px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Ödendi İşaretle
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showFeeModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {selectedFee ? 'Ödeme Düzenle' : 'Yeni Ödeme Ekle'}
              </h3>
              <button
                onClick={() => {
                  setShowFeeModal(false);
                  setSelectedFee(null);
                  resetForm();
                  setBulkAdd(false);
                  setSelectedMonths([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitFee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ödeme Tipi</label>
                <select
                  required
                  value={form.payment_type}
                  onChange={(e) => {
                    setForm({ ...form, payment_type: e.target.value as 'education' | 'stationery' | 'meal' });
                    if (e.target.value === 'stationery') {
                      setBulkAdd(false);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="education">Eğitim Ödemesi (Aylık)</option>
                  <option value="meal">Yemek Ödemesi (Aylık)</option>
                  <option value="stationery">Kırtasiye Ödemesi (Yıllık)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Çocuk</label>
                <select
                  required
                  value={form.child_id}
                  onChange={(e) => setForm({ ...form, child_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Çocuk seçin...</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {!selectedFee && form.payment_type !== 'stationery' && (
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={bulkAdd}
                      onChange={(e) => {
                        setBulkAdd(e.target.checked);
                        if (!e.target.checked) {
                          setSelectedMonths([]);
                        }
                      }}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Toplu Ay Ekleme</span>
                  </label>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tutar (TL)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {bulkAdd ? 'İlk Ödeme Tarihi' : 'Son Ödeme Tarihi'}
                  </label>
                  <input
                    type="date"
                    required
                    value={form.due_date}
                    onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>

              {bulkAdd && form.payment_type !== 'stationery' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aylar Seçin</label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {allMonths.map((month) => (
                        <label
                          key={month}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMonths.includes(month)}
                            onChange={() => toggleMonth(month)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">{month}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {selectedMonths.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      {selectedMonths.length} ay seçildi
                    </p>
                  )}
                </div>
              ) : (
                form.payment_type !== 'stationery' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ay</label>
                    <select
                      required={!bulkAdd && form.payment_type !== 'stationery'}
                      value={form.month}
                      onChange={(e) => setForm({ ...form, month: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Ay seçin...</option>
                      {allMonths.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Akademik Yıl</label>
                <input
                  type="text"
                  required
                  value={form.academic_year}
                  onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="2024-2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notlar</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Ek notlar (isteğe bağlı)..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowFeeModal(false);
                    setSelectedFee(null);
                    resetForm();
                    setBulkAdd(false);
                    setSelectedMonths([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  {selectedFee ? 'Güncelle' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReminderModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Hatırlatma Gönder</h3>
              <button
                onClick={() => {
                  setShowReminderModal(false);
                  setReminderForm({ message: '', parent_ids: [] });
                  setSendToAll(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendReminder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                <textarea
                  required
                  value={reminderForm.message}
                  onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder="Hatırlatma mesajınızı yazın..."
                />
              </div>

              <div>
                <label className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={sendToAll}
                    onChange={(e) => {
                      setSendToAll(e.target.checked);
                      if (e.target.checked) {
                        setReminderForm({ ...reminderForm, parent_ids: [] });
                      }
                    }}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Tüm velilere gönder</span>
                </label>

                {!sendToAll && (
                  <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto bg-gray-50">
                    <p className="text-sm text-gray-600 mb-3">Velileri seçin:</p>
                    <div className="space-y-2">
                      {parents.map((parent) => (
                        <label
                          key={parent.id}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={reminderForm.parent_ids.includes(parent.id)}
                            onChange={() => toggleParent(parent.id)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-800">{parent.full_name}</span>
                            <span className="text-xs text-gray-500 ml-2">({parent.email})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {sendToAll && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    Bu mesaj <span className="font-semibold">{parents.length}</span> veliye gönderilecektir.
                  </p>
                )}

                {!sendToAll && reminderForm.parent_ids.length > 0 && (
                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg mt-2">
                    <span className="font-semibold">{reminderForm.parent_ids.length}</span> veli seçildi.
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowReminderModal(false);
                    setReminderForm({ message: '', parent_ids: [] });
                    setSendToAll(true);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center space-x-2"
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
