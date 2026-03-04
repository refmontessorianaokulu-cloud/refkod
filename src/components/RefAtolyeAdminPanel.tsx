import { useState } from 'react';
import { Calendar as CalendarIcon, ShoppingCart, ClipboardList, ChevronDown, ChevronRight } from 'lucide-react';
import PlayGroupManagement from './PlayGroupManagement';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';

export default function RefAtolyeAdminPanel() {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="space-y-4">
      {/* Oyun Grubu Yönetimi */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('playgroup')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-800">Oyun Grubu Yönetimi</h3>
          </div>
          {openSection === 'playgroup' ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {openSection === 'playgroup' && (
          <div className="p-6 bg-white border-t border-gray-200">
            <PlayGroupManagement />
          </div>
        )}
      </div>

      {/* Ürün Yönetimi */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('product')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-800">Ürün Yönetimi</h3>
          </div>
          {openSection === 'product' ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {openSection === 'product' && (
          <div className="p-6 bg-white border-t border-gray-200">
            <ProductManagement />
          </div>
        )}
      </div>

      {/* Sipariş Yönetimi */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('order')}
          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-800">Sipariş Yönetimi</h3>
          </div>
          {openSection === 'order' ? (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {openSection === 'order' && (
          <div className="p-6 bg-white border-t border-gray-200">
            <OrderManagement />
          </div>
        )}
      </div>
    </div>
  );
}
