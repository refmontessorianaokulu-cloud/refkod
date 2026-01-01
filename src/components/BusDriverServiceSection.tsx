import { useState, useEffect } from 'react';
import { supabase, Child } from '../lib/supabase';
import { MapPin, Car, Navigation, Clock, PlayCircle, StopCircle, Baby, AlertCircle } from 'lucide-react';

interface Props {
  driverId: string;
}

export default function BusDriverServiceSection({ driverId }: Props) {
  const [vehicle, setVehicle] = useState<any>(null);
  const [route, setRoute] = useState<any>(null);
  const [children, setChildren] = useState<(Child & { pickup_address?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    loadDriverInfo();
  }, [driverId]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  const loadDriverInfo = async () => {
    setLoading(true);
    try {
      const { data: vehicleData } = await supabase
        .from('service_vehicles')
        .select('*')
        .eq('driver_id', driverId)
        .eq('is_active', true)
        .maybeSingle();

      if (!vehicleData) {
        setLoading(false);
        return;
      }

      setVehicle(vehicleData);

      const { data: routeData } = await supabase
        .from('service_routes')
        .select('*')
        .eq('vehicle_id', vehicleData.id)
        .eq('is_active', true)
        .maybeSingle();

      if (routeData) {
        setRoute(routeData);

        const { data: assignmentsData } = await supabase
          .from('child_service_assignments')
          .select(`
            pickup_address,
            uses_service,
            children (
              id,
              first_name,
              last_name,
              birth_date,
              class_name,
              photo_url
            )
          `)
          .eq('route_id', routeData.id)
          .eq('uses_service', true);

        if (assignmentsData) {
          const childrenList = assignmentsData
            .filter((a: any) => a.children)
            .map((a: any) => ({
              ...a.children,
              pickup_address: a.pickup_address,
            }));
          setChildren(childrenList);
        }
      }
    } catch (error) {
      console.error('Error loading driver info:', error);
    } finally {
      setLoading(false);
    }
  };

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      setLocationError('Tarayıcınız konum paylaşımını desteklemiyor');
      return;
    }

    if (!vehicle) {
      setLocationError('Araç bilgisi bulunamadı');
      return;
    }

    setLocationError(null);
    setSharing(true);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;

        setLastLocation({ lat: latitude, lng: longitude });

        try {
          await supabase.from('service_location_tracking').insert({
            vehicle_id: vehicle.id,
            driver_id: driverId,
            route_id: route?.id || null,
            latitude: latitude,
            longitude: longitude,
            speed: speed ? speed * 3.6 : null,
            heading: heading,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error saving location:', error);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError('Konum alınamadı. Lütfen konum iznini kontrol edin.');
        setSharing(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  const stopLocationSharing = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setSharing(false);
    setLastLocation(null);
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Yükleniyor...
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Size atanmış bir araç bulunamadı.</p>
        <p className="text-sm text-gray-500 mt-2">Lütfen yönetici ile iletişime geçin.</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="text-center py-12">
        <Navigation className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Bu araç için aktif bir rota bulunamadı.</p>
        <p className="text-sm text-gray-500 mt-2">Lütfen yönetici ile iletişime geçin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Servis Takibi</h2>
            <div className="space-y-1">
              <p className="text-gray-700">
                <span className="font-semibold">Araç:</span> {vehicle.vehicle_name}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Plaka:</span> {vehicle.license_plate}
              </p>
              <p className="text-gray-700">
                <span className="font-semibold">Rota:</span> {route.route_name}
              </p>
              {route.departure_time && (
                <p className="text-gray-700 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="font-semibold">Kalkış:</span>
                  <span className="ml-1">{route.departure_time}</span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            {!sharing ? (
              <button
                onClick={startLocationSharing}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
              >
                <PlayCircle className="w-5 h-5" />
                <span className="font-semibold">Konum Paylaşımını Başlat</span>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={stopLocationSharing}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg hover:from-red-700 hover:to-rose-700 transition-all shadow-lg"
                >
                  <StopCircle className="w-5 h-5" />
                  <span className="font-semibold">Konum Paylaşımını Durdur</span>
                </button>
                {lastLocation && (
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <div className="flex items-center space-x-2 text-green-600 mb-1">
                      <MapPin className="w-4 h-4 animate-pulse" />
                      <span className="text-sm font-semibold">Konum Paylaşılıyor</span>
                    </div>
                    <p className="text-xs text-gray-600 font-mono">
                      {lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center mt-1"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Haritada Görüntüle
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {locationError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{locationError}</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
          <Baby className="w-6 h-6 mr-2 text-blue-600" />
          Rotadaki Çocuklar ({children.length})
        </h3>

        {children.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
            <Baby className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">Bu rotada kayıtlı çocuk bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {children.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start space-x-3">
                  {child.photo_url ? (
                    <img
                      src={child.photo_url}
                      alt={`${child.first_name} ${child.last_name}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-200 to-cyan-200 flex items-center justify-center border-2 border-blue-200">
                      <Baby className="w-8 h-8 text-blue-700" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {child.first_name} {child.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">{child.class_name}</p>
                    {child.pickup_address && (
                      <div className="mt-2 flex items-start space-x-1">
                        <MapPin className="w-3 h-3 text-gray-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {child.pickup_address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
