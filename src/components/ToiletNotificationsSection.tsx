import { useState, useEffect } from 'react';
import { supabase, ToiletNotification, Child, Profile } from '../lib/supabase';
import { Baby, CheckCircle, Clock } from 'lucide-react';

interface Props {
  userId: string;
}

export default function ToiletNotificationsSection({ userId }: Props) {
  const [notifications, setNotifications] = useState<(ToiletNotification & { child?: Child; sender?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel('toilet_notifications_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'toilet_notifications' }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('toilet_notifications')
        .select(`
          *,
          child:children(first_name, last_name, photo_url),
          sender:profiles!sent_by(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('toilet_notifications')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const handleComplete = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('toilet_notifications')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      alert('Hata oluştu: ' + (error as Error).message);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-800';
    if (status === 'acknowledged') return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'completed') return 'Tamamlandı';
    if (status === 'acknowledged') return 'Görüldü';
    return 'Bekliyor';
  };

  const pendingNotifications = notifications.filter(n => n.status === 'pending' || n.status === 'acknowledged');
  const completedNotifications = notifications.filter(n => n.status === 'completed');

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tuvalet Bildirimleri</h2>
        <p className="text-sm text-gray-600 mt-1">
          Öğretmenlerin gönderdiği tuvalet bildirimleri
        </p>
      </div>

      {pendingNotifications.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm mr-2">
              {pendingNotifications.length}
            </span>
            Bekleyen Bildirimler
          </h3>
          <div className="space-y-4">
            {pendingNotifications.map((notification) => (
              <div
                key={notification.id}
                className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {notification.child?.photo_url ? (
                    <img
                      src={notification.child.photo_url}
                      alt={`${notification.child.first_name} ${notification.child.last_name}`}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-200 to-cyan-200 flex items-center justify-center border-2 border-white shadow-sm">
                      <Baby className="w-8 h-8 text-teal-700" />
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-800 mb-1">
                      {notification.child?.first_name} {notification.child?.last_name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Öğretmen: {notification.sender?.full_name}
                    </p>
                    {notification.notes && (
                      <p className="text-sm text-gray-700 bg-white p-3 rounded-lg mb-3">
                        {notification.notes}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                        {getStatusLabel(notification.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {notification.status === 'pending' && (
                        <button
                          onClick={() => handleAcknowledge(notification.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Gördüm</span>
                        </button>
                      )}
                      {(notification.status === 'pending' || notification.status === 'acknowledged') && (
                        <button
                          onClick={() => handleComplete(notification.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Tamamlandı</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {completedNotifications.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tamamlanan Bildirimler</h3>
          <div className="space-y-3">
            {completedNotifications.slice(0, 5).map((notification) => (
              <div
                key={notification.id}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  {notification.child?.photo_url ? (
                    <img
                      src={notification.child.photo_url}
                      alt={`${notification.child.first_name} ${notification.child.last_name}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Baby className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {notification.child?.first_name} {notification.child?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {notification.completed_at && new Date(notification.completed_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.status)}`}>
                    {getStatusLabel(notification.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifications.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Baby className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p>Henüz bildirim yok</p>
        </div>
      )}
    </div>
  );
}
