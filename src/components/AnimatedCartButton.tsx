import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AnimatedCartButtonProps {
  onClick: () => void;
}

export default function AnimatedCartButton({ onClick }: AnimatedCartButtonProps) {
  const { user } = useAuth();
  const [colorIndex, setColorIndex] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const colors = [
    'bg-orange-500 hover:bg-orange-600',
    'bg-blue-500 hover:bg-blue-600',
    'bg-red-500 hover:bg-red-600',
    'bg-green-500 hover:bg-green-600',
    'bg-yellow-500 hover:bg-yellow-600',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadCartCount();

    const handleCartUpdate = () => {
      loadCartCount();
    };

    window.addEventListener('cart-updated', handleCartUpdate);
    const interval = setInterval(loadCartCount, 2000);

    return () => {
      window.removeEventListener('cart-updated', handleCartUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const loadCartCount = async () => {
    try {
      let count = 0;

      if (user) {
        const { data } = await supabase
          .from('shopping_cart')
          .select('quantity')
          .eq('user_id', user.id);

        if (data) {
          count = data.reduce((sum, item) => sum + item.quantity, 0);
        }
      } else {
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        count = guestCart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
      }

      setCartCount(count);
    } catch (error) {
      console.error('Error loading cart count:', error);
    }
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-14 h-14 ${colors[colorIndex]} text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 group relative`}
      title="Sepetim"
    >
      <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-white text-gray-900 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-current">
          {cartCount > 99 ? '99+' : cartCount}
        </span>
      )}
    </button>
  );
}
