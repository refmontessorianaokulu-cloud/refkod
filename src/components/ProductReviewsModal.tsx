import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Star, Upload, Image as ImageIcon, Trash2, CreditCard as Edit2 } from 'lucide-react';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  images: string[];
  is_verified_purchase: boolean;
  created_at: string;
  profiles: {
    full_name: string;
  };
}

interface ProductReviewsModalProps {
  product: {
    id: string;
    name: string;
    average_rating?: number;
    review_count?: number;
  };
  onClose: () => void;
}

const maskName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');

  return parts.map(part => {
    if (part.length === 0) return '';
    return part[0] + '*'.repeat(part.length - 1);
  }).join(' ');
};

export default function ProductReviewsModal({ product, onClose }: ProductReviewsModalProps) {
  const { user, profile } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    loadReviews();
    if (user) {
      checkCanReview();
    }
  }, [product.id]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq('product_id', product.id)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCanReview = async () => {
    try {
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('user_id', user!.id)
        .eq('product_id', product.id)
        .maybeSingle();

      if (existingReview) {
        setCanReview(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner (
            product_id
          )
        `)
        .eq('user_id', user!.id)
        .eq('status', 'delivered')
        .eq('order_items.product_id', product.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setCanReview(true);
        setDeliveredOrders(data);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Bu değerlendirmeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      alert('Değerlendirme başarıyla silindi');
      loadReviews();
      if (user) {
        checkCanReview();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Hata: ' + (error as Error).message);
    }
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setShowWriteReview(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= (product.average_rating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {(product.average_rating || 0).toFixed(1)} ({product.review_count || 0} değerlendirme)
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {user && canReview && !showWriteReview && (
            <div className="mb-6">
              <button
                onClick={() => setShowWriteReview(true)}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
              >
                Değerlendirme Yaz
              </button>
            </div>
          )}

          {showWriteReview && (
            <WriteReviewForm
              productId={product.id}
              orderId={deliveredOrders[0]?.id}
              onSuccess={() => {
                setShowWriteReview(false);
                loadReviews();
                if (user) {
                  checkCanReview();
                }
              }}
              onCancel={() => setShowWriteReview(false)}
            />
          )}

          {editingReview && (
            <EditReviewForm
              review={editingReview}
              onSuccess={() => {
                setEditingReview(null);
                loadReviews();
              }}
              onCancel={() => setEditingReview(null)}
            />
          )}

          <div className="space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Yükleniyor...</p>
            ) : reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Henüz değerlendirme yapılmamış</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{maskName(review.profiles.full_name)}</p>
                        {review.is_verified_purchase && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
                            Doğrulanmış Alışveriş
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      {(user?.id === review.user_id || profile?.role === 'admin') && (
                        <div className="flex gap-1">
                          {user?.id === review.user_id && (
                            <button
                              onClick={() => handleEditReview(review)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{review.comment}</p>
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {review.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Yorum görseli ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-80"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WriteReviewForm({
  productId,
  orderId,
  onSuccess,
  onCancel
}: {
  productId: string;
  orderId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const imageUrls: string[] = [];

      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('review-media')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-media')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        user_id: user!.id,
        order_id: orderId,
        rating,
        comment,
        images: imageUrls,
        is_verified_purchase: true,
        is_approved: true,
      });

      if (error) throw error;

      alert('Değerlendirmeniz başarıyla gönderildi!');
      onSuccess();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Hata: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 mb-6">
      <h4 className="font-semibold text-gray-800 mb-4">Değerlendirmenizi Yazın</h4>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Puanınız</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="transition-colors"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredStar || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Yorumunuz</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          rows={4}
          placeholder="Ürün hakkındaki görüşlerinizi paylaşın..."
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fotoğraflar (Opsiyonel, maksimum 5)
        </label>
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-colors">
          <ImageIcon className="w-5 h-5 text-gray-400" />
          <span className="text-sm text-gray-600">Fotoğraf Seç</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
        </label>
        {images.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          disabled={uploading}
        >
          İptal
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300"
          disabled={uploading}
        >
          {uploading ? 'Gönderiliyor...' : 'Gönder'}
        </button>
      </div>
    </form>
  );
}

function EditReviewForm({
  review,
  onSuccess,
  onCancel
}: {
  review: Review;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.comment);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(review.images || []);
  const [uploading, setUploading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      const totalImages = existingImages.length + images.length + newImages.length;
      if (totalImages > 5) {
        alert('Maksimum 5 fotoğraf yükleyebilirsiniz');
        return;
      }
      setImages([...images, ...newImages]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const imageUrls: string[] = [...existingImages];

      for (const image of images) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${user!.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('review-media')
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('review-media')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      const { error } = await supabase
        .from('product_reviews')
        .update({
          rating,
          comment,
          images: imageUrls,
        })
        .eq('id', review.id);

      if (error) throw error;

      alert('Değerlendirmeniz başarıyla güncellendi!');
      onSuccess();
    } catch (error) {
      console.error('Error updating review:', error);
      alert('Hata: ' + (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-lg p-4 mb-6">
      <h4 className="font-semibold text-gray-800 mb-4">Değerlendirmenizi Düzenleyin</h4>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Puanınız</label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              className="transition-colors"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredStar || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Yorumunuz</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          rows={4}
          placeholder="Ürün hakkındaki görüşlerinizi paylaşın..."
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fotoğraflar (Opsiyonel, maksimum 5)
        </label>

        {existingImages.length + images.length < 5 && (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-emerald-500 transition-colors mb-2">
            <ImageIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">Fotoğraf Ekle</span>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </label>
        )}

        {(existingImages.length > 0 || images.length > 0) && (
          <div className="flex gap-2 flex-wrap">
            {existingImages.map((image, index) => (
              <div key={`existing-${index}`} className="relative">
                <img
                  src={image}
                  alt={`Existing ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            {images.map((image, index) => (
              <div key={`new-${index}`} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`New ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, i) => i !== index))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          disabled={uploading}
        >
          İptal
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300"
          disabled={uploading}
        >
          {uploading ? 'Güncelleniyor...' : 'Güncelle'}
        </button>
      </div>
    </form>
  );
}
