import React, { useState, useEffect, useCallback } from 'react';
import StatCard    from './components/StatCard';
import OrdersPanel from './components/OrdersPanel';
import MenuPanel   from './components/MenuPanel';
import LoginModal  from './components/LoginModal';
import { API_BASE } from './constants';

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ active, onNavigate, ordersCount, onLogout }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
    { id: 'orders',    icon: '🧾', label: 'الطلبات',     badge: ordersCount },
    { id: 'menu',      icon: '🍽️', label: 'قائمة الأصناف' },
  ];

  return (
    <aside className="w-64 shrink-0 bg-dark-800 border-l border-white/5 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xl">
            👑
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">مطعم القيصر</h1>
            <p className="text-gray-500 text-xs">لوحة الإدارة</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className={`sidebar-link w-full text-right ${active === item.id ? 'active' : ''}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge > 0 && (
              <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-white/5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-500/20 to-brand-700/20 text-brand-400 border border-brand-500/30 hover:from-brand-500 hover:to-brand-600 hover:text-white transition-all shadow-lg text-right w-full block"
          >
            <span className="text-lg">🛒</span>
            <span className="flex-1">واجهة طلب العميل</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft" />
          <span className="text-gray-500 text-xs">SSE متصل</span>
        </div>
        <button
          onClick={onLogout}
          title="تسجيل الخروج"
          className="text-gray-500 hover:text-red-400 text-xs transition-colors p-1"
        >
          خروج 🚪
        </button>
      </div>
    </aside>
  );
}

// ── Dashboard Overview ─────────────────────────────────────────────────────────
function DashboardOverview({ stats }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">مرحباً بك 👋</h2>
        <p className="text-gray-500 mt-1">نظرة عامة على أداء المطعم اليوم</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard icon="🧾" label="إجمالي الطلبات"   value={stats.total}      sub="اليوم"   color="brand"  />
        <StatCard icon="⏳" label="جارِ الانتظار"    value={stats.pending}    sub="1-2 د"   color="yellow" />
        <StatCard icon="👨‍🍳" label="قيد التحضير"   value={stats.preparing}  sub="25-45 د" color="blue"   />
        <StatCard icon="🛵" label="مع المندوب"      value={stats.delivering} sub="10-20 د" color="purple" />
        <StatCard icon="✅" label="تم التسليم"       value={stats.delivered}  sub="مكتمل"   color="green"  />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-8">
        <div className="card">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="text-brand-400">💰</span> إجمالي الإيرادات
          </h3>
          <div className="text-4xl font-bold text-brand-400">{stats.revenue.toFixed(0)}</div>
          <div className="text-gray-500 text-sm mt-1">جنيه مصري</div>
        </div>
        <div className="card">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="text-blue-400">📈</span> متوسط قيمة الطلب
          </h3>
          <div className="text-4xl font-bold text-blue-400">
            {stats.total > 0 ? (stats.revenue / stats.total).toFixed(0) : 0}
          </div>
          <div className="text-gray-500 text-sm mt-1">جنيه مصري</div>
        </div>
      </div>

      {/* Quick guide */}
      <div className="card border-brand-500/10 bg-gradient-to-br from-brand-500/5 to-transparent">
        <h3 className="text-white font-bold mb-3">🚀 دليل سريع</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-gray-400">
          <div className="bg-dark-700/50 rounded-xl p-3">
            <div className="text-brand-400 font-bold mb-1">1. الطلبات الواردة</div>
            اضغط <strong className="text-white">الطلبات</strong> لرؤية الطلبات وتغيير حالتها
          </div>
          <div className="bg-dark-700/50 rounded-xl p-3">
            <div className="text-brand-400 font-bold mb-1">2. إدارة القائمة</div>
            اضغط <strong className="text-white">الأصناف</strong> لإضافة/تعديل/حذف الأصناف
          </div>
          <div className="bg-dark-700/50 rounded-xl p-3">
            <div className="text-brand-400 font-bold mb-1">3. تتبع العميل</div>
            شارك رابط <code className="text-xs bg-dark-600 px-1 rounded">customer/index.html</code> مع العميل
          </div>
        </div>
      </div>
    </div>
  );
}

// ── App Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [page,   setPage]   = useState('dashboard');
  const [isAuth, setIsAuth] = useState(() => sessionStorage.getItem('qaysar_admin_auth') === 'true');
  const [stats,  setStats]  = useState({ total: 0, pending: 0, preparing: 0, delivering: 0, delivered: 0, revenue: 0 });

  const handleLogout = () => {
    sessionStorage.removeItem('qaysar_admin_auth');
    setIsAuth(false);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/orders`);
      const json = await res.json();
      if (json.success) {
        const orders = json.data;
        setStats({
          total:      orders.length,
          pending:    orders.filter(o => o.status === 'pending').length,
          preparing:  orders.filter(o => o.status === 'preparing').length,
          delivering: orders.filter(o => o.status === 'delivering' || o.status === 'ready').length,
          delivered:  orders.filter(o => o.status === 'delivered').length,
          revenue:    orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isAuth) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuth, fetchStats]);

  const renderPage = () => {
    switch (page) {
      case 'orders':    return <OrdersPanel />;
      case 'menu':      return <MenuPanel />;
      default:          return <DashboardOverview stats={stats} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900">
      {!isAuth && <LoginModal onLogin={setIsAuth} />}

      <Sidebar
        active={page}
        onNavigate={setPage}
        ordersCount={stats.pending}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-gray-400 text-sm">
            <span>لوحة الإدارة</span>
            <span className="text-gray-700">/</span>
            <span className="text-white font-medium">
              {{ dashboard: 'الرئيسية', orders: 'الطلبات', menu: 'الأصناف' }[page]}
            </span>
          </div>
          <div className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}
