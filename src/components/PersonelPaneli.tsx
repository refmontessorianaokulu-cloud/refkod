import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Car, MapPin, Users, Clock, LogOut, Navigation } from 'lucide-react';

interface Vehicle {
  id: string;
  vehicle_name: string;
  license_plate: string;
  capacity: number;
}

interface Route {
  id: string;
  route_name: string;
  departure_time: string;
  estimated_arrival_time: string;
  vehicle_id: string;
}

interface ChildAssignment {
  id: string;
  pickup_address: string;
  children: {
    first_name: string;
    last_name: string;
  };
}

export default function PersonelPaneli() {
  const { user, profile, signOut } = useAuth();
  const [isSharing, setIsSharing] = useState(false);
  const [myVehicle, setMyVehicle] = useState<Vehicle | null>(null);
  const [activeRoute, setActiveRoute] = useState<Route | null>(null);
  const [children, setChildren] = useState<ChildAssignment[]>([]);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const [lastLocation, setLastLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (profile?.staff_role === 'bus_driver') {
      loadDriverData();
    }
  }, [profile]);

  const loadDriverData = async () => {
    if (!user) return;

    const { data: vehicle } = await supabase
      .from('service_vehicles')
      .select('*')
      .eq('driver_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (vehicle) {
      setMyVehicle(vehicle);

      const { data: route } = await supabase
        .from('service_routes')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .eq('is_active', true)
        .maybeSingle();

      if (route) {
        setActiveRoute(route);

        const { data: assignments } = await supabase
          .from('child_service_assignments')
          .select(`
            id,
            pickup_address,
            children:child_id (
              first_name,
              last_name
            )
          `)
          .eq('route_id', route.id)
          .eq('uses_service', true);

        if (assignments) {
          setChildren(assignments);
        }
      }
    }
  };

  const startLocationSharing = () => {
    if (!navigator.geolocation) {
      alert('Tarayıcınız konum paylaşımını desteklemiyor.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, speed, heading } = position.coords;

        setLastLocation({ lat: latitude, lng: longitude });

        if (myVehicle && user) {
          await supabase.from('service_location_tracking').insert({
            vehicle_id: myVehicle.id,
            driver_id: user.id,
            route_id: activeRoute?.id || null,
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            speed: speed ? speed.toString() : null,
            heading: heading ? heading.toString() : null,
            timestamp: new Date().toISOString(),
          });
        }
      },
      (error) => {
        console.error('Konum alınamadı:', error);
        alert('Konum bilgisi alınamadı. Lütfen konum izinlerini kontrol edin.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    setLocationWatchId(watchId);
    setIsSharing(true);
  };

  const stopLocationSharing = () => {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
      setIsSharing(false);
    }
  };

  const getStaffRoleDisplay = (role: string | undefined) => {
    switch (role) {
      case 'cook':
        return 'Aşçı';
      case 'cleaning_staff':
        return 'Temizlik Personeli';
      case 'bus_driver':
        return 'Servis Şöförü';
      case 'other':
        return 'Diğer';
      default:
        return 'Personel';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Personel Paneli</h1>
            <p className="text-gray-600 mt-2">
              Hoş geldiniz, {profile?.full_name} - {getStaffRoleDisplay(profile?.staff_role)}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Çıkış Yap</span>
          </button>
        </div>

        {profile?.staff_role === 'bus_driver' ? (
          <div className="space-y-6">
            {myVehicle && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-500 p-3 rounded-lg">
                    <Car className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Araç Bilgileri</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Araç Adı</p>
                    <p className="text-lg font-semibold text-gray-900">{myVehicle.vehicle_name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Plaka</p>
                    <p className="text-lg font-semibold text-gray-900">{myVehicle.license_plate}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Kapasite</p>
                    <p className="text-lg font-semibold text-gray-900">{myVehicle.capacity} Kişi</p>
                  </div>
                </div>
              </div>
            )}

            {activeRoute && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-green-500 p-3 rounded-lg">
                    <Navigation className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Rota Bilgileri</h2>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Rota Adı</p>
                    <p className="text-lg font-semibold text-gray-900">{activeRoute.route_name}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Kalkış Saati</p>
                    <p className="text-lg font-semibold text-gray-900">{activeRoute.departure_time}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Tahmini Varış</p>
                    <p className="text-lg font-semibold text-gray-900">{activeRoute.estimated_arrival_time}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Konum Paylaşımı</h2>
                    <p className="text-sm text-gray-600">
                      {isSharing ? 'Konum paylaşılıyor' : 'Konum paylaşımı kapalı'}
                    </p>
                  </div>
                </div>
                {!isSharing ? (
                  <button
                    onClick={startLocationSharing}
                    disabled={!myVehicle}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Konum Paylaşımını Başlat</span>
                  </button>
                ) : (
                  <button
                    onClick={stopLocationSharing}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>Konum Paylaşımını Durdur</span>
                  </button>
                )}
              </div>

              {isSharing && lastLocation && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-semibold text-green-800 mb-2">Anlık Konum:</p>
                  <p className="text-sm text-gray-700">
                    Enlem: {lastLocation.lat.toFixed(6)}, Boylam: {lastLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}
            </div>

            {children.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-orange-500 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Rotadaki Çocuklar</h2>
                    <p className="text-sm text-gray-600">{children.length} çocuk</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {children.map((assignment: any) => (
                    <div
                      key={assignment.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {assignment.children.first_name} {assignment.children.last_name}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            {assignment.pickup_address}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {getStaffRoleDisplay(profile?.staff_role)} Paneli
              </h2>
              <p className="text-gray-600">
                {profile?.staff_role === 'cook' && 'Aşçı olarak sisteme giriş yaptınız. Yemek menüsü yönetimi için yetkili olabilirsiniz.'}
                {profile?.staff_role === 'cleaning_staff' && 'Temizlik personeli olarak sisteme giriş yaptınız.'}
                {profile?.staff_role === 'other' && 'Personel olarak sisteme giriş yaptınız.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
