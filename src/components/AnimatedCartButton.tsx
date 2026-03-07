import { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

interface AnimatedCartButtonProps {
  onClick: () => void;
}

export default function AnimatedCartButton({ onClick }: AnimatedCartButtonProps) {
  const [colorIndex, setColorIndex] = useState(0);
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

  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center w-14 h-14 ${colors[colorIndex]} text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 group relative`}
      title="Sepetim"
    >
      <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
    </button>
  );
}
