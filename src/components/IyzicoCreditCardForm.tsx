import React, { useState, useEffect } from 'react';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';

interface InstallmentOption {
  installmentNumber: number;
  price: string;
  totalPrice: string;
  installmentPrice: string;
}

interface CreditCardFormProps {
  amount: number;
  onSubmit: (cardDetails: any, installment: number) => void;
  loading?: boolean;
}

export default function IyzicoCreditCardForm({ amount, onSubmit, loading = false }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [expireMonth, setExpireMonth] = useState('');
  const [expireYear, setExpireYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [installmentOptions, setInstallmentOptions] = useState<InstallmentOption[]>([]);
  const [selectedInstallment, setSelectedInstallment] = useState(1);
  const [loadingInstallments, setLoadingInstallments] = useState(false);
  const [error, setError] = useState('');

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    return formatted;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(value);

      if (value.length >= 6) {
        fetchInstallmentOptions(value.substring(0, 6));
      } else {
        setInstallmentOptions([]);
        setSelectedInstallment(1);
      }
    }
  };

  const fetchInstallmentOptions = async (binNumber: string) => {
    setLoadingInstallments(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iyzico-installment-options`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            binNumber: binNumber,
            price: amount,
          }),
        }
      );

      const data = await response.json();

      if (data.success && data.installmentOptions) {
        setInstallmentOptions(data.installmentOptions);
      } else {
        setInstallmentOptions([]);
      }
    } catch (error) {
      console.error('Taksit bilgileri alınamadı:', error);
      setInstallmentOptions([]);
    } finally {
      setLoadingInstallments(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!cardNumber || cardNumber.length !== 16) {
      setError('Geçerli bir kart numarası girin');
      return;
    }

    if (!cardHolderName || cardHolderName.length < 3) {
      setError('Kart sahibi adını girin');
      return;
    }

    if (!expireMonth || !expireYear) {
      setError('Son kullanma tarihini girin');
      return;
    }

    if (!cvc || cvc.length < 3) {
      setError('CVV kodunu girin');
      return;
    }

    onSubmit(
      {
        cardNumber: cardNumber,
        cardHolderName: cardHolderName,
        expireMonth: expireMonth,
        expireYear: expireYear,
        cvc: cvc,
        registerCard: saveCard ? 1 : 0,
      },
      selectedInstallment
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <CreditCard className="w-8 h-8" />
          <Lock className="w-5 h-5 text-green-400" />
        </div>
        <div className="mb-4">
          <div className="text-2xl font-mono tracking-wider">
            {formatCardNumber(cardNumber) || '•••• •••• •••• ••••'}
          </div>
        </div>
        <div className="flex justify-between items-end">
          <div>
            <div className="text-xs text-slate-400 mb-1">Kart Sahibi</div>
            <div className="font-semibold uppercase">
              {cardHolderName || 'AD SOYAD'}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 mb-1">Son Kullanma</div>
            <div className="font-mono">
              {expireMonth && expireYear ? `${expireMonth}/${expireYear}` : 'AA/YY'}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-800">{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Kart Numarası
        </label>
        <input
          type="text"
          value={formatCardNumber(cardNumber)}
          onChange={handleCardNumberChange}
          placeholder="0000 0000 0000 0000"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Kart Sahibi
        </label>
        <input
          type="text"
          value={cardHolderName}
          onChange={(e) => setCardHolderName(e.target.value.toUpperCase())}
          placeholder="AD SOYAD"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Ay
          </label>
          <input
            type="text"
            value={expireMonth}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 2 && (parseInt(value) <= 12 || value === '')) {
                setExpireMonth(value);
              }
            }}
            placeholder="AA"
            maxLength={2}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Yıl
          </label>
          <input
            type="text"
            value={expireYear}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 2) {
                setExpireYear(value);
              }
            }}
            placeholder="YY"
            maxLength={2}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            CVV
          </label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 3) {
                setCvc(value);
              }
            }}
            placeholder="***"
            maxLength={3}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
        </div>
      </div>

      {installmentOptions.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Taksit Seçenekleri
          </label>
          <div className="space-y-2">
            {installmentOptions.map((option) => (
              <label
                key={option.installmentNumber}
                className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedInstallment === option.installmentNumber
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="installment"
                    value={option.installmentNumber}
                    checked={selectedInstallment === option.installmentNumber}
                    onChange={() => setSelectedInstallment(option.installmentNumber)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-semibold text-slate-900">
                      {option.installmentNumber === 1
                        ? 'Tek Çekim'
                        : `${option.installmentNumber} Taksit`}
                    </div>
                    {option.installmentNumber > 1 && (
                      <div className="text-sm text-slate-600">
                        Aylık {parseFloat(option.installmentPrice).toFixed(2)} TL
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">
                    {parseFloat(option.totalPrice).toFixed(2)} TL
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {loadingInstallments && (
        <div className="text-center text-sm text-slate-600">
          Taksit seçenekleri yükleniyor...
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="saveCard"
          checked={saveCard}
          onChange={(e) => setSaveCard(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
          disabled={loading}
        />
        <label htmlFor="saveCard" className="text-sm text-slate-700">
          Kartımı gelecek ödemeler için kaydet
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            İşleniyor...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5" />
            Güvenli Ödeme Yap ({amount.toFixed(2)} TL)
          </>
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Lock className="w-4 h-4" />
          <span>256-bit SSL</span>
        </div>
        <span>•</span>
        <span>3D Secure</span>
        <span>•</span>
        <span>PCI DSS Uyumlu</span>
      </div>
    </form>
  );
}
