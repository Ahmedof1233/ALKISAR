// ── Middleware: Rate Limiter ──────────────────────────────────────────────────
// يحمي المسارات الحساسة (مثل إنشاء الطلبات وتعديلها) من الإغراق والطلبات العشوائية
function createRateLimiter({
  windowMs = 60 * 1000, // المدة الزمنية الافتراضية: دقيقة واحدة
  max = 5,              // الحد الأقصى للطلبات في المدة
  message = 'عفواً، لقد قمت بإرسال عدد كبير من الطلبات في وقت قصير. يرجى الانتظار قليلاً والمحاولة مجدداً.'
} = {}) {
  const ipMap = new Map(); // ip -> [timestamps]

  // تنظيف السجلات القديمة تلقائياً كل 5 دقائق لتوفير الذاكرة
  const cleaner = setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipMap.entries()) {
      const active = timestamps.filter(t => now - t < windowMs);
      if (active.length === 0) {
        ipMap.delete(ip);
      } else {
        ipMap.set(ip, active);
      }
    }
  }, 5 * 60 * 1000);

  if (cleaner.unref) cleaner.unref();

  return (req, res, next) => {
    // استخراج IP العميل بدقة بما يدعم Vercel و Proxies
    const rawIp = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || 'unknown';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0].trim() : 'unknown';
    const now = Date.now();

    const currentTimestamps = (ipMap.get(clientIp) || []).filter(t => now - t < windowMs);

    if (currentTimestamps.length >= max) {
      const earliest = currentTimestamps[0];
      const retryAfterSec = Math.ceil((windowMs - (now - earliest)) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message,
        retryAfter: retryAfterSec
      });
    }

    currentTimestamps.push(now);
    ipMap.set(clientIp, currentTimestamps);
    next();
  };
}

module.exports = { createRateLimiter };
