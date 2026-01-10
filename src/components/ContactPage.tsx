import { ArrowLeft, MapPin, Phone, Mail } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export default function ContactPage({ onBack }: ContactPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium">Geri Dön</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-12 text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/whatsapp_image_2025-08-19_at_11.03.29.jpeg"
                alt="REF Logo"
                className="w-24 h-24 object-contain drop-shadow-lg"
              />
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">İletişim</h1>
            <p className="text-emerald-50 text-lg">Ref Çocuk Akademisi</p>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all">
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-600 text-white p-3 rounded-lg">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Adres</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Mustafa Kemal Paşa Mah.<br />
                      Cansever Sk. No:34-38/A<br />
                      Arnavutköy - İstanbul
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="tel:+905315504454"
                className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Telefon</h3>
                    <p className="text-blue-600 text-lg font-medium group-hover:underline">
                      0531 550 44 54
                    </p>
                  </div>
                </div>
              </a>

              <a
                href="mailto:bilgi@refcocukakademisi.com"
                className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-md hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-purple-600 text-white p-3 rounded-lg group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">E-posta</h3>
                    <p className="text-purple-600 text-sm font-medium group-hover:underline break-all">
                      bilgi@refcocukakademisi.com
                    </p>
                  </div>
                </div>
              </a>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 shadow-inner">
              <h3 className="font-semibold text-gray-800 mb-4 text-lg">Konum</h3>
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps?q=Ref+%C3%87ocuk+Akademisi+Mustafa+Kemal+Pa%C5%9Fa+Mah+Cansever+Sok+34-38%2FA+Arnavutk%C3%B6y+%C4%B0stanbul&output=embed"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ref Çocuk Akademisi Konumu"
                  className="w-full"
                />
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href="https://www.google.com/maps/dir/?api=1&destination=Ref+Çocuk+Akademisi+Mustafa+Kemal+Paşa+Mah+Cansever+Sok+34-38/A+Arnavutköy+İstanbul"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Yol Tarifi Al
                </a>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Ref+Çocuk+Akademisi+Mustafa+Kemal+Paşa+Mah+Cansever+Sok+34-38/A+Arnavutköy+İstanbul"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors shadow-md hover:shadow-lg"
                >
                  Haritada Göster
                </a>
              </div>
            </div>

            <div className="mt-8 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
              <h3 className="font-semibold text-gray-800 mb-3 text-lg">Çalışma Saatleri</h3>
              <div className="space-y-2 text-gray-700">
                <div className="flex justify-between">
                  <span className="font-medium">Pazartesi - Cuma:</span>
                  <span>08:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Cumartesi:</span>
                  <span>Kapalı</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Pazar:</span>
                  <span>Kapalı</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
