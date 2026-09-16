import React, { useEffect, useState, useCallback, useRef } from 'react';
import { API_BASE, STATUS_MAP, NEXT_STATUS_LABEL } from '../constants';

// ── مكوّن بطاقة الطلب الواحد ───────────────────────────────────────────────
function OrderCard({ order, onStatusChange, updating }) {
  const { label, badge, icon, next } = STATUS_MAP[order.status] || STATUS_MAP.pending;
  const items = Array.isArray(order.items_json) ? order.items_json : (Array.isArray(order.items) ? order.items : []);

  return (
    <div className="card animate-slide-in hover:border-white/10 transition-all duration-300 group flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] sm:text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-lg font-mono">
                #{String(order.id).padStart(4, '0')}
              </span>
              <span className={badge}>{icon} {label}</span>
            </div>
            <h3 className="text-white font-bold text-base sm:text-lg break-words leading-tight">{order.customer_name}</h3>
            {(order.customer_phone || order.phone) && (
              <p className="text-gray-400 text-xs sm:text-sm mt-1 flex items-center gap-1">
                <span>📞</span>
                <span dir="ltr">{order.customer_phone || order.phone}</span>
              </p>
            )}
            {(order.customer_address || order.address) && (
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5 flex items-center gap-1">
                <span>📍</span>
                <span>{order.customer_address || order.address}</span>
              </p>
            )}
          </div>
          <div className="text-left shrink-0">
            <div className="text-brand-400 font-bold text-lg sm:text-xl whitespace-nowrap">{order.total_amount} ج.م</div>
            <div className="text-gray-500 text-[11px] sm:text-xs mt-1">
              {new Date(order.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-1.5 mb-3 sm:mb-4 bg-dark-700/50 rounded-xl p-2.5 sm:p-3 text-xs sm:text-sm">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-gray-300 truncate ml-2">{item.name}</span>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-gray-500 font-mono">×{item.quantity || item.qty || 1}</span>
                <span className="text-gray-300 font-medium">{(item.price || 0) * (item.quantity || item.qty || 1)} ج.م</span>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-xl px-3 py-2 mb-3 text-xs sm:text-sm">
            <p className="text-yellow-400/90 leading-relaxed">📝 {order.notes}</p>
          </div>
        )}

        {/* Average Time Tag */}
        {STATUS_MAP[order.status]?.avgTime && (
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-gray-400 bg-white/5 rounded-lg px-2.5 py-1.5 mb-3 w-fit">
            <span>⏱️</span>
            <span>متوسط المرحلة: <strong className="text-gray-200">{STATUS_MAP[order.status]?.avgTime}</strong></span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/5">
        {order.status !== 'delivered' && next && (
          <button
            id={`btn-advance-${order.id}`}
            onClick={() => onStatusChange(order.id, next)}
            disabled={updating === order.id}
            className="flex-1 btn-primary py-2 sm:py-2.5 px-3 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating === order.id ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <span>{STATUS_MAP[next]?.icon || '➡️'}</span>
                <span>{NEXT_STATUS_LABEL[order.status]}</span>
              </>
            )}
          </button>
        )}

        {/* زر طباعة بون الطلب للمطبخ/الكاشير */}
        <button
          onClick={() => {
            const printWin = window.open('', '_blank', 'width=350,height=600');
            if (!printWin) return;
            const dateStr = new Date(order.created_at).toLocaleString('ar-EG');
            const itemsRows = items.map(it => `
              <tr>
                <td style="padding:4px 0; border-bottom:1px dashed #ccc;">${it.name}</td>
                <td style="text-align:center; padding:4px 0; border-bottom:1px dashed #ccc;">x${it.quantity || it.qty || 1}</td>
                <td style="text-align:left; padding:4px 0; border-bottom:1px dashed #ccc;">${(it.price || 0) * (it.quantity || it.qty || 1)} ج.م</td>
              </tr>
            `).join('');

            printWin.document.write(`
              <!DOCTYPE html>
              <html dir="rtl" lang="ar">
              <head>
                <meta charset="utf-8">
                <title>بون طلب #${String(order.id).padStart(4,'0')}</title>
                <style>
                  body { font-family: monospace, sans-serif; padding: 10px; font-size: 13px; color: #000; }
                  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 8px; }
                  .bold { font-weight: bold; }
                  table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                  .total { border-top: 2px solid #000; font-size: 15px; font-weight: bold; margin-top: 8px; padding-top: 8px; }
                  @media print { button { display: none; } }
                </style>
              </head>
              <body>
                <div class="header">
                  <h2 style="margin:0 0 4px 0;">👑 مطعم القيصر</h2>
                  <div>بون مطبخ / كاشير</div>
                  <div style="font-size:16px; font-weight:bold; margin-top:4px;">طلب #${String(order.id).padStart(4,'0')}</div>
                  <div style="font-size:11px; color:#555;">${dateStr}</div>
                </div>
                <div><strong>العميل:</strong> ${order.customer_name}</div>
                <div><strong>الهاتف:</strong> ${order.customer_phone || order.phone || ''}</div>
                <div><strong>العنوان:</strong> ${order.customer_address || order.address || 'استلام من الفرع'}</div>
                ${order.notes ? `<div><strong>ملاحظات:</strong> ${order.notes}</div>` : ''}
                <table>
                  <thead>
                    <tr style="border-bottom:1px solid #000;">
                      <th style="text-align:right;">الصنف</th>
                      <th style="text-align:center;">الكمية</th>
                      <th style="text-align:left;">السعر</th>
                    </tr>
                  </thead>
                  <tbody>${itemsRows}</tbody>
                </table>
                <div class="total" style="display:flex; justify-content:space-between;">
                  <span>الإجمالي:</span>
                  <span>${order.total_amount} ج.م</span>
                </div>
                <div style="text-align:center; margin-top:15px; font-size:11px;">وجبة شهية نتمنى لكم يوماً سعيداً ❤️</div>
                <script>window.onload = function() { window.print(); }<\/script>
              </body>
              </html>
            `);
            printWin.document.close();
          }}
          title="طباعة بون الطلب"
          className="px-3 py-2 sm:py-2.5 bg-dark-700 hover:bg-dark-600 text-gray-300 hover:text-white rounded-xl text-sm font-medium border border-white/10 transition-colors flex items-center justify-center shrink-0"
        >
          <span>🖨️</span>
        </button>

        {order.status === 'delivered' && (
          <div className="flex-1 flex items-center justify-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-xl py-2 text-green-400 font-semibold text-xs sm:text-sm">
            <span>✅</span>
            <span>مكتمل</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── مكوّن Filter Tabs ─────────────────────────────────────────────────────────
function FilterTab({ label, count, active, onClick, color }) {
  const colors = {
    all:        'text-white border-white/30',
    pending:    'text-yellow-400 border-yellow-500/30',
    preparing:  'text-blue-400 border-blue-500/30',
    delivering: 'text-purple-400 border-purple-500/30',
    delivered:  'text-green-400 border-green-500/30',
    ready:      'text-purple-400 border-purple-500/30',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 border whitespace-nowrap shrink-0
        ${active
          ? `bg-white/10 ${colors[color]} shadow-lg`
          : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'
        }`}
    >
      {label}
      {count !== undefined && (
        <span className="mr-1.5 px-1.5 py-0.5 rounded-full text-[11px] bg-white/10">{count}</span>
      )}
    </button>
  );
}

// ── مكوّن Panel الرئيسي ───────────────────────────────────────────────────────
export default function OrdersPanel() {
  const [orders,      setOrders]      = useState([]);
  const [filter,      setFilter]      = useState('all');
  const [loading,     setLoading]     = useState(true);
  const [updating,    setUpdating]    = useState(null);
  const [liveMsg,     setLiveMsg]     = useState(null);
  const [clearing,    setClearing]    = useState(false);
  const [showClearDlg,setShowClearDlg]= useState(false);
  const [exporting,   setExporting]   = useState(false);
  const eventSourceRef                = useRef(null);

  // ── طلب إذن الإشعارات عند أول تحميل ────────────────────────────────────────
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ── نغمة تنبيه صوتية باستخدام Web Audio API (بدون ملفات خارجية) ────────────
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const now = ctx.currentTime;
      // نغمة مزدوجة راقية وجاذبة للانتباه (دو - مي - صول)
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(587.33, now, 0.25);        // D5
      playTone(880.00, now + 0.15, 0.4);  // A5
      playTone(1174.66, now + 0.35, 0.6); // D6
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  };

  // ── إرسال نوتيفيكاشن ─────────────────────────────────────────────────────
  const notify = (title, body, icon = '👑') => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      const n = new Notification(`${icon} ${title}`, {
        body,
        icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👑</text></svg>",
        badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👑</text></svg>",
        dir: 'rtl',
        lang: 'ar',
        requireInteraction: false,
      });
      setTimeout(() => n.close(), 6000);
    } catch {}
  };

  const knownOrderIdsRef = useRef(new Set());
  const isInitialLoadRef = useRef(true);

  // ── جلب الطلبات ──────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async (isPolling = false) => {
    try {
      const res  = await fetch(`${API_BASE}/orders`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const fetchedOrders = json.data;

        if (isPolling && !isInitialLoadRef.current) {
          // فحص وصول طلبات جديدة عبر الـ polling
          const newOrders = fetchedOrders.filter(o => !knownOrderIdsRef.current.has(o.id));
          if (newOrders.length > 0) {
            const first = newOrders[0];
            const orderNum = `#${String(first.id).padStart(4, '0')}`;
            setLiveMsg(`🆕 ${newOrders.length > 1 ? `${newOrders.length} طلبات جديدة وصلت!` : `طلب جديد من ${first.customer_name} (${orderNum})`}`);
            setTimeout(() => setLiveMsg(null), 5000);
            playChime();
            notify(
              `طلب جديد ${orderNum} 🆕`,
              `من: ${first.customer_name}\nالإجمالي: ${first.total_amount} ج.م`,
              '🆕'
            );
          }
        }

        knownOrderIdsRef.current = new Set(fetchedOrders.map(o => o.id));
        isInitialLoadRef.current = false;
        setOrders(fetchedOrders);
      }
    } catch (e) {
      console.error('خطأ في جلب الطلبات:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── SSE + Polling دوري فائق السرعة لضمان التحديث الفوري ──────────────────
  useEffect(() => {
    // 1. جلب أولي فوري
    fetchOrders(false);

    // 2. فحص دوري كل 3.5 ثانية كضمان أساسي (حاسم في بيئة سيرفرلس مثل Vercel)
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 3500);

    // 3. SSE للبث اللحظي الفوري
    let es = null;
    try {
      es = new EventSource(`${API_BASE}/orders/stream`);
      eventSourceRef.current = es;

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);

          if (payload.type === 'status_update') {
            const statusLabel = STATUS_MAP[payload.order.status]?.label || payload.order.status;
            const orderNum    = `#${String(payload.order.id).padStart(4, '0')}`;
            setOrders(prev =>
              prev.map(o => o.id === payload.order.id
                ? { ...o, status: payload.order.status, updated_at: payload.order.updated_at }
                : o
              )
            );
            setLiveMsg(`🔄 تحديث الطلب ${orderNum} — ${statusLabel}`);
            setTimeout(() => setLiveMsg(null), 4000);
            notify(
              `تحديث طلب ${orderNum}`,
              `الحالة الجديدة: ${statusLabel}\nالعميل: ${payload.order.customer_name || ''}`,
              STATUS_MAP[payload.order.status]?.icon || '🔄'
            );
          }

          if (payload.type === 'new_order') {
            const orderNum = `#${String(payload.order.id).padStart(4, '0')}`;
            setOrders(prev => {
              if (prev.some(o => o.id === payload.order.id)) return prev;
              return [payload.order, ...prev];
            });
            knownOrderIdsRef.current.add(payload.order.id);
            setLiveMsg(`🆕 طلب جديد من ${payload.order.customer_name}`);
            setTimeout(() => setLiveMsg(null), 5000);
            
            // 🔔 رنين صوتي للأوردر الجديد في المطبخ/الكاشير
            playChime();

            // 🔔 نوتيفيكاشن المتصفح
            notify(
              `طلب جديد ${orderNum} 🆕`,
              `من: ${payload.order.customer_name}\nالإجمالي: ${payload.order.total_amount} ج.م`,
              '🆕'
            );
          }

          if (payload.type === 'order_updated') {
            const orderNum = `#${String(payload.order.id).padStart(4, '0')}`;
            setOrders(prev =>
              prev.map(o => o.id === payload.order.id ? payload.order : o)
            );
            setLiveMsg(`✏️ العميل عدّل محتويات الطلب ${orderNum} (${payload.order.total_amount} ج.م)`);
            setTimeout(() => setLiveMsg(null), 5000);

            playChime();

            notify(
              `تعديل طلب ${orderNum} ✏️`,
              `العميل قام بتعديل محتويات الطلب\nالإجمالي الجديد: ${payload.order.total_amount} ج.م`,
              '✏️'
            );
          }
        } catch (err) {
          console.error('Error handling SSE event:', err);
        }
      };

      es.onerror = () => {
        // الـ Polling يقوم بالتغطية المستمرة حتى لو حدث انقطاع في SSE
      };
    } catch (err) {
      console.warn('SSE initialization error:', err);
    }

    return () => {
      clearInterval(pollInterval);
      if (es) es.close();
    };
  }, [fetchOrders]);

  // ── تحديث حالة الطلب ─────────────────────────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res  = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setOrders(prev =>
          prev.map(o => o.id === orderId ? json.data : o)
        );
      }
    } catch (e) {
      console.error('خطأ في تحديث الحالة:', e);
    } finally {
      setUpdating(null);
    }
  };

  // ── حذف جميع الطلبات ────────────────────────────────────────────────────────────────
  const handleClearAll = async () => {
    setClearing(true);
    setShowClearDlg(false);
    try {
      const res  = await fetch(`${API_BASE}/orders`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setOrders([]);
        setFilter('all');
      }
    } catch (e) {
      console.error('خطأ في مسح الطلبات:', e);
    } finally {
      setClearing(false);
    }
  };

  // ── تصدير PDF للطلبات المُسَلَّمَة ────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    setExporting(true);
    try {
      const res  = await fetch(`${API_BASE}/orders/export?status=delivered`);
      const json = await res.json();
      if (!json.success) return;

      const deliveredOrders = json.data;
      const grandTotal      = deliveredOrders.reduce((s, o) => s + o.total_amount, 0);
      const now             = new Date().toLocaleDateString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

      const rows = deliveredOrders.map(o => {
        const items = o.items_json.map(it =>
          `<tr><td style="padding:3px 8px;color:#555">${it.name}</td><td style="padding:3px 8px;text-align:center;color:#555">×${it.qty || it.quantity || 1}</td><td style="padding:3px 8px;text-align:left;color:#555">${((it.price||0)*(it.qty||it.quantity||1)).toFixed(2)}</td></tr>`
        ).join('');
        return `
          <div style="border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:12px;page-break-inside:avoid">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
              <div>
                <span style="font-size:13px;font-weight:700;color:#111">#${String(o.id).padStart(4,'0')} &nbsp;&nbsp; ${o.customer_name}</span><br/>
                <span style="font-size:11px;color:#6b7280">هاتف: ${o.customer_phone} &nbsp;|&nbsp; ${o.customer_address}</span>
              </div>
              <div style="text-align:left">
                <span style="font-size:14px;font-weight:800;color:#ea580c">${o.total_amount.toFixed(2)} ج.م</span><br/>
                <span style="font-size:10px;color:#9ca3af">${new Date(o.created_at).toLocaleDateString('ar-EG')}</span>
              </div>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <thead><tr style="background:#f9fafb">
                <th style="padding:4px 8px;text-align:right;color:#374151">الصنف</th>
                <th style="padding:4px 8px;text-align:center;color:#374151">كمية</th>
                <th style="padding:4px 8px;text-align:left;color:#374151">سعر</th>
              </tr></thead>
              <tbody>${items}</tbody>
            </table>
            ${o.notes ? `<p style="margin:6px 0 0;font-size:11px;color:#9ca3af">ملاحظات: ${o.notes}</p>` : ''}
          </div>`;
      }).join('');

      const html = `<!DOCTYPE html><html lang="ar" dir="rtl"><head>
        <meta charset="UTF-8"/>
        <title>تقرير مطعم القيصر</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0}
          body{font-family:Arial,sans-serif;color:#111;padding:24px;direction:rtl}
          @page{margin:18mm 14mm}
          @media print{
            .no-print{display:none!important}
            body{padding:0}
          }
        </style>
      </head><body>
        <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #ea580c;padding-bottom:14px">
          <div style="font-size:26px;font-weight:900;color:#ea580c">❤️ مطعم القيصر</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">تقرير الطلبات المُسلَّمَة</div>
          <div style="font-size:12px;color:#9ca3af;margin-top:2px">تاريخ التصدير: ${now}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 16px;margin-bottom:20px">
          <span style="font-size:14px;font-weight:700;color:#374151">جملة الطلبات المُسلَّمَة: <strong style="color:#ea580c">${deliveredOrders.length}</strong> طلب</span>
          <span style="font-size:16px;font-weight:900;color:#ea580c">إجمالي الإيرادات: ${grandTotal.toFixed(2)} ج.م</span>
        </div>
        ${rows || '<p style="text-align:center;color:#9ca3af;padding:40px">لا توجد طلبات مسلَّمَة حتى الآن</p>'}
        <button class="no-print" onclick="window.print()" style="position:fixed;bottom:24px;right:24px;background:#ea580c;color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:15px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(234,88,12,.4)">↓ حفظ PDF</button>
      </body></html>`;

      const win = window.open('', '_blank', 'width=900,height=700');
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 600);
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setExporting(false);
    }
  };

  // ── تصفية الطلبات ─────────────────────────────────────────────────────────
  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);
  const counts = {
    all:        orders.length,
    pending:    orders.filter(o => o.status === 'pending').length,
    preparing:  orders.filter(o => o.status === 'preparing').length,
    delivering: orders.filter(o => o.status === 'delivering' || o.status === 'ready').length,
    delivered:  orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="animate-fade-in">
      {/* Live Notification */}
      {liveMsg && (
        <div className="fixed top-4 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 bg-dark-700/95 backdrop-blur-md border border-brand-500/40 text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-2xl shadow-2xl animate-slide-in flex items-center justify-center gap-2.5 text-xs sm:text-sm max-w-lg mx-auto">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-soft shrink-0" />
          <span className="truncate">{liveMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">إدارة الطلبات</h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">متابعة مراحل التحضير والتوصيل فورياً</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* PDF Export */}
          <button
            id="btn-export-pdf"
            onClick={handleExportPdf}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs sm:text-sm py-2 px-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all disabled:opacity-50">
            {exporting ? <span className="animate-spin">⏳</span> : <span>📄</span>}
            <span>تصدير PDF</span>
          </button>
          {/* Clear All */}
          <button
            id="btn-clear-all-orders"
            onClick={() => setShowClearDlg(true)}
            disabled={clearing || orders.length === 0}
            className="flex items-center gap-1.5 text-xs sm:text-sm py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all disabled:opacity-50">
            {clearing ? <span className="animate-spin">⏳</span> : <span>🗑️</span>}
            <span>مسح الكل</span>
          </button>
          {/* Refresh */}
          <button
            id="btn-refresh-orders"
            onClick={() => fetchOrders(false)}
            className="btn-ghost flex items-center gap-1.5 text-xs sm:text-sm py-2 px-3 shrink-0">
            <span>🔄</span>
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Confirm Clear Dialog */}
      {showClearDlg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowClearDlg(false)}>
          <div className="bg-dark-800 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-in" onClick={e => e.stopPropagation()}>
            <div className="text-4xl text-center mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-white text-center mb-2">تأكيد حذف جميع الطلبات</h3>
            <p className="text-gray-400 text-sm text-center mb-6">سيتم حذف <strong className="text-red-400">{orders.length} طلب</strong> نهائياً ولا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearDlg(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
                إلغاء
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors shadow-lg shadow-red-500/20">
                نعم، احذف الكل
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 bg-dark-800 p-1.5 rounded-2xl overflow-x-auto max-w-full no-scrollbar">
        <FilterTab label="الكل"             count={counts.all}        active={filter==='all'}        color="all"        onClick={() => setFilter('all')}        />
        <FilterTab label="⏳ انتظار (1-2د)" count={counts.pending}    active={filter==='pending'}    color="pending"    onClick={() => setFilter('pending')}    />
        <FilterTab label="👨‍🍳 تحضير (25-45د)" count={counts.preparing} active={filter==='preparing'}  color="preparing"  onClick={() => setFilter('preparing')}  />
        <FilterTab label="🛵 مع المندوب (10-20د)" count={counts.delivering} active={filter==='delivering'} color="delivering" onClick={() => setFilter('delivering')} />
        <FilterTab label="✅ تم التسليم"     count={counts.delivered}  active={filter==='delivered'}  color="delivered"  onClick={() => setFilter('delivered')}  />
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="card h-48 animate-pulse bg-dark-700/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <span className="text-5xl sm:text-6xl mb-3">🍽️</span>
          <p className="text-base sm:text-lg font-medium">لا توجد طلبات في هذا القسم</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {filtered.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusChange={handleStatusChange}
              updating={updating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
