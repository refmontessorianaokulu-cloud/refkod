import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Calendar, DollarSign } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  plan_type: 'course' | 'playgroup';
  price: number;
  duration_months: number;
  features: string[];
  is_active: boolean;
  trial_days: number;
  max_users?: number;
  created_at: string;
}

export default function SubscriptionPlansManagement() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    plan_type: 'course',
    price: 0,
    duration_months: 1,
    features: [],
    is_active: true,
    trial_days: 0,
    max_users: undefined,
  });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
      alert('Planlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingPlan.id);

        if (error) throw error;
        alert('Plan güncellendi');
      } else {
        const { error } = await supabase
          .from('subscription_plans')
          .insert(formData);

        if (error) throw error;
        alert('Plan oluşturuldu');
      }

      setShowForm(false);
      setEditingPlan(null);
      setFormData({
        name: '',
        description: '',
        plan_type: 'course',
        price: 0,
        duration_months: 1,
        features: [],
        is_active: true,
        trial_days: 0,
        max_users: undefined,
      });
      setFeatureInput('');
      loadPlans();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData(plan);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu planı silmek istediğinizden emin misiniz?')) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Plan silindi');
      loadPlans();
    } catch (error) {
      alert('Hata: ' + (error as Error).message);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures.splice(index, 1);
    setFormData({ ...formData, features: newFeatures });
  };

  if (loading) {
    return <div className="text-center py-12">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-slate-800">Abonelik Planları</h3>
        <button
          onClick={() => {
            setEditingPlan(null);
            setFormData({
              name: '',
              description: '',
              plan_type: 'course',
              price: 0,
              duration_months: 1,
              features: [],
              is_active: true,
              trial_days: 0,
              max_users: undefined,
            });
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Yeni Plan
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${
              plan.is_active ? 'border-green-200' : 'border-slate-200'
            }`}
          >
            <div className={`p-6 ${plan.plan_type === 'course' ? 'bg-gradient-to-br from-blue-50 to-blue-100' : 'bg-gradient-to-br from-orange-50 to-orange-100'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{plan.name}</h4>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                    plan.plan_type === 'course' ? 'bg-blue-200 text-blue-800' : 'bg-orange-200 text-orange-800'
                  }`}>
                    {plan.plan_type === 'course' ? 'Online Kurs' : 'Oyun Grubu'}
                  </span>
                </div>
                {!plan.is_active && (
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded">Pasif</span>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {plan.price.toFixed(2)} ₺
                <span className="text-sm font-normal text-slate-600">/ay</span>
              </div>
              <p className="text-sm text-slate-600 mb-4">{plan.description}</p>
            </div>

            <div className="p-6">
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <span>{plan.duration_months} ay süre</span>
                </div>
                {plan.trial_days > 0 && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <DollarSign className="w-4 h-4" />
                    <span>{plan.trial_days} gün deneme</span>
                  </div>
                )}
                {plan.max_users && (
                  <div className="text-sm text-slate-600">
                    Max {plan.max_users} kullanıcı
                  </div>
                )}
              </div>

              {plan.features && plan.features.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-slate-700 mb-2">Özellikler:</div>
                  <ul className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Düzenle
                </button>
                <button
                  onClick={() => handleDelete(plan.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Sil
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-800">
                  {editingPlan ? 'Planı Düzenle' : 'Yeni Plan Oluştur'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingPlan(null);
                  }}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Plan Adı *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Temel Plan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Açıklama</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Plan açıklaması..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Plan Tipi *</label>
                    <select
                      required
                      value={formData.plan_type}
                      onChange={(e) => setFormData({ ...formData, plan_type: e.target.value as 'course' | 'playgroup' })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="course">Online Kurs</option>
                      <option value="playgroup">Oyun Grubu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Aylık Ücret (₺) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Süre (Ay) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({ ...formData, duration_months: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Deneme (Gün)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.trial_days}
                      onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Kullanıcı</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.max_users || ''}
                      onChange={(e) => setFormData({ ...formData, max_users: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Sınırsız"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Özellikler</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Özellik ekle..."
                    />
                    <button
                      type="button"
                      onClick={addFeature}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Ekle
                    </button>
                  </div>
                  {formData.features && formData.features.length > 0 && (
                    <ul className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm text-slate-700">{feature}</span>
                          <button
                            type="button"
                            onClick={() => removeFeature(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm text-slate-700">
                    Planı aktif et
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPlan(null);
                    }}
                    className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Save className="w-5 h-5" />
                    {editingPlan ? 'Güncelle' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          Henüz abonelik planı eklenmemiş
        </div>
      )}
    </div>
  );
}
