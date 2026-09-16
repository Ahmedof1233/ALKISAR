// رابط الـ Backend API (يدعم البيئات المختلفة تلقائياً وبشكل متوافق ومضمون)
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

function resolveApiBase() {
  let base = (import.meta.env.VITE_API_BASE || '').trim();
  if (!base) {
    base = isLocal ? 'http://localhost:3001/api' : 'https://alkisar-ge9b.vercel.app/api';
  }
  // إزالة أي سلاش في النهاية
  base = base.replace(/\/+$/, '');
  // التأكد من أن المسار ينتهي دائماً بـ /api
  if (!base.endsWith('/api')) {
    base = base + '/api';
  }
  return base;
}

export const API_BASE = resolveApiBase();
export const IMG_BASE = API_BASE.replace(/\/api\/?$/, '');

// خريطة الحالات بالعربية مع متوسط الوقت التقريبي
export const STATUS_MAP = {
  pending:    { label: 'جارِ الانتظار',        badge: 'badge-pending',    icon: '⏳', next: 'preparing',  avgTime: '1 - 2 دقيقة' },
  preparing:  { label: 'قيد التحضير',         badge: 'badge-preparing',  icon: '👨‍🍳', next: 'delivering', avgTime: '25 - 45 دقيقة' },
  delivering: { label: 'تم التسليم للمندوب',  badge: 'badge-delivering', icon: '🛵', next: 'delivered',   avgTime: '10 - 20 دقيقة' },
  delivered:  { label: 'تم تسليم الطلب',      badge: 'badge-delivered',  icon: '✅', next: null,          avgTime: 'مكتمل' },
  // دعم التوافق للطلبات السابقة
  ready:      { label: 'تم التسليم للمندوب',  badge: 'badge-delivering', icon: '🛵', next: 'delivered',   avgTime: '10 - 20 دقيقة' },
};

export const NEXT_STATUS_LABEL = {
  pending:    'بدء التحضير 👨‍🍳',
  preparing:  'تسليم للمندوب 🛵',
  delivering: 'تأكيد التسليم للعميل ✅',
  ready:      'تأكيد التسليم للعميل ✅',
  delivered:  null,
};

export const CATEGORIES = ['عام', 'رئيسي', 'مقبلات', 'سلطات', 'مشروبات', 'حلويات'];
