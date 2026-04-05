import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MapPin, Calendar, Clock, CheckCircle, XCircle, Info } from 'lucide-react';

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
}

interface Child {
  id: string;
  first_name: string;
  last_name: string;
  class_name: string;
}

interface Consent {
  child_id: string;
  consent_type: 'participate' | 'stay_at_school';
}

export default function FieldTripConsentsSection() {
  const { profile, user } = useAuth();
  const [trips, setTrips] = useState<FieldTrip[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [consents, setConsents] = useState<Record<string, Consent>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('Profile changed:', profile);
    if (profile?.id) {
      console.log('Profile ID exists, fetching data...');
      fetchData();
    } else {
      console.log('No profile ID, skipping fetch');
    }
  }, [profile?.id]);

  async function fetchData() {
    try {
      console.log('Fetching field trips and children...');
      console.log('Parent ID:', profile?.id);
      console.log('Current timestamp:', new Date().toISOString());

      const [tripsRes, childrenRes] = await Promise.all([
        supabase
          .from('field_trips')
          .select('*')
          .eq('is_active', true)
          .gte('deadline', new Date().toISOString())
          .order('trip_date', { ascending: true }),

        supabase
          .from('parent_children')
          .select('children (id, first_name, last_name, class_name)')
          .eq('parent_id', profile?.id)
      ]);

      console.log('Trips response:', tripsRes);
      console.log('Children response:', childrenRes);

      if (tripsRes.error) {
        console.error('Trips error:', tripsRes.error);
        throw tripsRes.error;
      }
      if (childrenRes.error) {
        console.error('Children error:', childrenRes.error);
        throw childrenRes.error;
      }

      const formattedChildren = (childrenRes.data || [])
        .map((pc: any) => pc.children)
        .filter(Boolean);

      console.log('Formatted children:', formattedChildren);
      console.log('Trips data:', tripsRes.data);

      setTrips(tripsRes.data || []);
      setChildren(formattedChildren);

      if (tripsRes.data && formattedChildren.length > 0) {
        await fetchConsents(
          tripsRes.data.map(t => t.id),
          formattedChildren.map(c => c.id)
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Veri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }

  async function fetchConsents(tripIds: string[], childIds: string[]) {
    try {
      const { data, error } = await supabase
        .from('field_trip_consents')
        .select('field_trip_id, child_id, consent_type')
        .in('field_trip_id', tripIds)
        .in('child_id', childIds);

      if (error) throw error;

      const consentMap: Record<string, Consent> = {};
      (data || []).forEach((consent: any) => {
        const key = `${consent.field_trip_id}-${consent.child_id}`;
        consentMap[key] = {
          child_id: consent.child_id,
          consent_type: consent.consent_type,
        };
      });

      setConsents(consentMap);
    } catch (error) {
      console.error('Error fetching consents:', error);
    }
  }

  async function handleConsentChange(
    tripId: string,
    childId: string,
    consentType: 'participate' | 'stay_at_school'
  ) {
    const key = `${tripId}-${childId}`;
    setSaving(key);

    try {
      if (!user?.id) {
        throw new Error('Kullanıcı girişi yapılmamış');
      }

      const { error } = await supabase
        .from('field_trip_consents')
        .upsert({
          field_trip_id: tripId,
          parent_id: user.id,
          child_id: childId,
          consent_type: consentType,
        }, {
          onConflict: 'field_trip_id,child_id'
        });

      if (error) throw error;

      setConsents({
        ...consents,
        [key]: { child_id: childId, consent_type: consentType },
      });
    } catch (error) {
      console.error('Error saving consent:', error);
      alert('Onay kaydedilemedi!');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Hata Oluştu</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchData();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Şu anda onay bekleyen gezi bulunmamaktadır.</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-12">
        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Kayıtlı çocuğunuz bulunmamaktadır.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gezi ve Ziyaret Onay Formları</h2>
        <p className="text-gray-600">
          Aşağıda listelenen gezi ve ziyaretler için çocuğunuzun katılım durumunu belirleyiniz.
        </p>
      </div>

      {trips.map((trip) => (
        <div
          key={trip.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{trip.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <span>{trip.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>{new Date(trip.trip_date).toLocaleDateString('tr-TR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>{trip.trip_time}</span>
              </div>
            </div>
            {trip.description && (
              <p className="mt-3 text-sm text-gray-700">{trip.description}</p>
            )}
            <div className="mt-3 p-3 bg-amber-50 rounded-lg">
              <p className="text-sm font-medium text-amber-800">
                Son Onay Tarihi: {new Date(trip.deadline).toLocaleDateString('tr-TR')}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {children.map((child) => {
              const key = `${trip.id}-${child.id}`;
              const consent = consents[key];
              const isSaving = saving === key;

              return (
                <div
                  key={child.id}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {child.first_name} {child.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{child.class_name}</p>
                    </div>
                    {consent && (
                      <div className="flex items-center gap-2 text-sm">
                        {consent.consent_type === 'participate' ? (
                          <span className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                            Katılacak
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-700 bg-orange-100 px-3 py-1 rounded-full">
                            <XCircle className="w-4 h-4" />
                            Okulda Kalacak
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={`consent-${key}`}
                        checked={consent?.consent_type === 'participate'}
                        onChange={() => handleConsentChange(trip.id, child.id, 'participate')}
                        disabled={isSaving}
                        className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        Çocuğumun bu geziye katılmasını <strong>onaylıyorum</strong>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={`consent-${key}`}
                        checked={consent?.consent_type === 'stay_at_school'}
                        onChange={() => handleConsentChange(trip.id, child.id, 'stay_at_school')}
                        disabled={isSaving}
                        className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-700 group-hover:text-gray-900">
                        Çocuğumun <strong>nöbetçi öğretmen eşliğinde okulda kalmasını</strong> istiyorum
                      </span>
                    </label>
                  </div>

                  {isSaving && (
                    <div className="mt-2 text-sm text-teal-600 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                      Kaydediliyor...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Önemli Bilgiler:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Onayınızı istediğiniz zaman değiştirebilirsiniz</li>
              <li>Son onay tarihine kadar karar verebilirsiniz</li>
              <li>Her çocuk için ayrı onay vermeniz gerekmektedir</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
