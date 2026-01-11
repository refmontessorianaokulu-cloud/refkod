import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved === 'en' || saved === 'tr') ? saved : 'tr';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const translations = language === 'tr' ? trTranslations : enTranslations;
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const trTranslations: Record<string, string> = {
  'login.title': 'E-REF',
  'login.email': 'E-posta',
  'login.password': 'Şifre',
  'login.loginButton': 'Giriş Yap',
  'login.loggingIn': 'Giriş yapılıyor...',
  'login.forgotPassword': 'Şifremi Unuttum',
  'login.guestLogin': 'Misafir Olarak Giriş Yap',
  'login.guestLoginDesc': 'Sadece ana sayfa ve hakkımızda bölümünü görüntüleyebilirsiniz',
  'login.forgotPasswordTitle': 'Şifremi Unuttum',
  'login.forgotPasswordDesc': 'E-posta adresinize şifre sıfırlama bağlantısı göndereceğiz',
  'login.sendResetLink': 'Şifre Sıfırlama Linki Gönder',
  'login.sending': 'Gönderiliyor...',
  'login.backToLogin': 'Giriş sayfasına dön',
  'login.applications': 'REF Danışmanlık',
  'login.inquiryForm': 'Ön Bilgi Talep Formu',
  'login.inquiryFormDesc': 'Formu doldurarak yönetici ile iletişime geçebilirsiniz',
  'login.referenceTeacher': 'Referans Öğretmen Programı Başvurusu',
  'login.referenceTeacherDesc': 'Son başvuru tarihi: 23 Ocak',
  'login.about': 'Hakkımızda',
  'login.contact': 'İletişim',
  'login.contactInfo': 'İletişim Bilgilerimiz',
  'login.emailPlaceholder': 'ornek@email.com',
  'login.passwordPlaceholder': '••••••••',

  'sidebar.adminPanel': 'Yönetici Paneli',
  'sidebar.teacherPanel': 'Öğretmen Paneli',
  'sidebar.parentPanel': 'Veli Paneli',
  'sidebar.guestPanel': 'Misafir Paneli',
  'sidebar.staffPanel': 'Personel Paneli',
  'sidebar.guidancePanel': 'Rehber Öğretmen Paneli',
  'sidebar.logout': 'Çıkış Yap',
  'sidebar.collapse': 'Daralt',
  'sidebar.expand': 'Genişlet',
  'sidebar.followUs': 'Bizi Takip Edin',

  'menu.homepage': 'Ana Sayfa',
  'menu.home': 'Ana Sayfa',
  'menu.about': 'Hakkımızda',
  'menu.refEcosystem': 'Ref Ekosistemi',
  'menu.refAkademi': 'Ref Akademi',
  'menu.refDanismanlik': 'Ref Danışmanlık',
  'menu.refAtolye': 'Ref Atölye',
  'menu.studentManagement': 'Öğrenci Yönetimi',
  'menu.children': 'Çocuklar',
  'menu.users': 'Kullanıcılar',
  'menu.attendance': 'Devamsızlık',
  'menu.reports': 'Raporlar ve Değerlendirme',
  'menu.montessoriReports': 'Montessori Raporları',
  'menu.branchReports': 'Branş Dersleri',
  'menu.teacherAssignments': 'Öğretmen Atamaları',
  'menu.behaviorIncidents': 'KOD Kayıtları',
  'menu.communication': 'İletişim',
  'menu.announcements': 'Duyurular',
  'menu.messages': 'Mesajlar',
  'menu.calendar': 'Akademik Takvim',
  'menu.finance': 'Finans ve Randevular',
  'menu.fees': 'Okul Ödemeleri',
  'menu.appointments': 'Randevular',
  'menu.operations': 'Operasyonel Yönetim',
  'menu.tasks': 'Görevlendirmeler',
  'menu.menu': 'Yemek Menüsü',
  'menu.duty': 'Nöbetçi Öğretmen',
  'menu.services': 'Hizmetler ve Talepler',
  'menu.servicesTracking': 'Servis Takibi',
  'menu.cleaning': 'Temizlik',
  'menu.materialRequests': 'Malzeme Talepleri',
  'menu.inquiries': 'Bilgi Talepleri',
  'menu.applications': 'Başvurular',
  'menu.referenceApplications': 'Referans Öğretmen',
  'menu.content': 'İçerik Yönetimi',
  'menu.contentManagement': 'Hakkımızda İçeriği',
  'menu.refManagement': 'Ref Ekosistemi Yönetimi',
  'menu.settings': 'Ayarlar',
  'menu.instagramSettings': 'Instagram Ayarları',
  'menu.videoSettings': 'Login Video Ayarları',

  'home.title': 'Ref Çocuk Akademisine HOŞGELDİNİZ!',
  'home.subtitle': 'Montessori School',
  'home.heading': 'Ref Çocuk Akademisi',
  'home.description1': 'Ref Çocuk Akademisi olarak, Montessori eğitim felsefesini benimseyerek çocuklarımızın doğal öğrenme süreçlerini destekliyoruz. Her çocuğun benzersiz potansiyelini keşfetmesi ve geliştirmesi için güvenli, destekleyici ve zengin bir öğrenme ortamı sunuyoruz.',
  'home.description2': 'Deneyimli eğitmenlerimiz ve özel olarak hazırlanmış Montessori materyallerimizle, çocuklarımız kendi hızlarında ilerleyerek pratik hayat becerileri, akademik temeller ve sosyal gelişim kazanırlar.',
  'home.description3': 'Okul öncesi eğitimde deneyimimizle, her çocuğa değer veren, onların bireysel farklılıklarını destekleyen ve özgüven kazandıran bir eğitim anlayışına sahibiz.',
  'home.readMore': 'Devamını Oku',

  'search.placeholder': 'Ara...',
  'search.noResults': 'Sonuç bulunamadı',
  'search.recentSearches': 'Son Aramalar',
  'search.popularSearches': 'Popüler Aramalar',
  'search.categories': 'Kategoriler',
  'search.searching': 'Aranıyor...',
};

const enTranslations: Record<string, string> = {
  'login.title': 'E-REF',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.loginButton': 'Login',
  'login.loggingIn': 'Logging in...',
  'login.forgotPassword': 'Forgot Password',
  'login.guestLogin': 'Login as Guest',
  'login.guestLoginDesc': 'You can only view the home page and about section',
  'login.forgotPasswordTitle': 'Forgot Password',
  'login.forgotPasswordDesc': 'We will send a password reset link to your email address',
  'login.sendResetLink': 'Send Password Reset Link',
  'login.sending': 'Sending...',
  'login.backToLogin': 'Back to login page',
  'login.applications': 'REF Consulting',
  'login.inquiryForm': 'Inquiry Form',
  'login.inquiryFormDesc': 'You can contact the administrator by filling out the form',
  'login.referenceTeacher': 'Reference Teacher Program Application',
  'login.referenceTeacherDesc': 'Application deadline: January 23',
  'login.about': 'About',
  'login.contact': 'Contact',
  'login.contactInfo': 'Contact Information',
  'login.emailPlaceholder': 'example@email.com',
  'login.passwordPlaceholder': '••••••••',

  'sidebar.adminPanel': 'Admin Panel',
  'sidebar.teacherPanel': 'Teacher Panel',
  'sidebar.parentPanel': 'Parent Panel',
  'sidebar.guestPanel': 'Guest Panel',
  'sidebar.staffPanel': 'Staff Panel',
  'sidebar.guidancePanel': 'Guidance Counselor Panel',
  'sidebar.logout': 'Logout',
  'sidebar.collapse': 'Collapse',
  'sidebar.expand': 'Expand',
  'sidebar.followUs': 'Follow Us',

  'menu.homepage': 'Home Page',
  'menu.home': 'Home',
  'menu.about': 'About',
  'menu.refEcosystem': 'Ref Ecosystem',
  'menu.refAkademi': 'Ref Academy',
  'menu.refDanismanlik': 'Ref Consulting',
  'menu.refAtolye': 'Ref Workshop',
  'menu.studentManagement': 'Student Management',
  'menu.children': 'Children',
  'menu.users': 'Users',
  'menu.attendance': 'Attendance',
  'menu.reports': 'Reports and Assessment',
  'menu.montessoriReports': 'Montessori Reports',
  'menu.branchReports': 'Subject Courses',
  'menu.teacherAssignments': 'Teacher Assignments',
  'menu.behaviorIncidents': 'Behavior Records',
  'menu.communication': 'Communication',
  'menu.announcements': 'Announcements',
  'menu.messages': 'Messages',
  'menu.calendar': 'Academic Calendar',
  'menu.finance': 'Finance and Appointments',
  'menu.fees': 'School Payments',
  'menu.appointments': 'Appointments',
  'menu.operations': 'Operational Management',
  'menu.tasks': 'Task Assignments',
  'menu.menu': 'Meal Menu',
  'menu.duty': 'Duty Teacher',
  'menu.services': 'Services and Requests',
  'menu.servicesTracking': 'Bus Tracking',
  'menu.cleaning': 'Cleaning',
  'menu.materialRequests': 'Material Requests',
  'menu.inquiries': 'Inquiry Requests',
  'menu.applications': 'Applications',
  'menu.referenceApplications': 'Reference Teacher',
  'menu.content': 'Content Management',
  'menu.contentManagement': 'About Content',
  'menu.refManagement': 'Ref Ecosystem Management',
  'menu.settings': 'Settings',
  'menu.instagramSettings': 'Instagram Settings',
  'menu.videoSettings': 'Login Video Settings',

  'home.title': 'WELCOME to Ref Children\'s Academy!',
  'home.subtitle': 'Montessori School',
  'home.heading': 'Ref Children\'s Academy',
  'home.description1': 'As Ref Children\'s Academy, we support the natural learning processes of our children by adopting the Montessori educational philosophy. We provide a safe, supportive and enriched learning environment for each child to discover and develop their unique potential.',
  'home.description2': 'With our experienced educators and specially prepared Montessori materials, our children progress at their own pace, gaining practical life skills, academic foundations and social development.',
  'home.description3': 'With our experience in preschool education, we have an educational approach that values each child, supports their individual differences and builds self-confidence.',
  'home.readMore': 'Read More',

  'search.placeholder': 'Search...',
  'search.noResults': 'No results found',
  'search.recentSearches': 'Recent Searches',
  'search.popularSearches': 'Popular Searches',
  'search.categories': 'Categories',
  'search.searching': 'Searching...',
};
