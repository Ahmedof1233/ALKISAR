import React, { useState, useEffect, useCallback } from 'react';
import StatCard    from './components/StatCard';
import OrdersPanel from './components/OrdersPanel';
import MenuPanel   from './components/MenuPanel';
import LoginModal  from './components/LoginModal';
import { API_BASE } from './constants';

// ── Sidebar Content (Reused in Desktop and Mobile Drawer) ──────────────────────
function SidebarContent({ active, onNavigate, ordersCount, onLogout, onClose, isMobile }) {
  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'لوحة التحكم' },
    { id: 'orders',    icon: '🧾', label: 'الطلبات',     badge: ordersCount },
    { id: 'menu',      icon: '🍽️', label: 'قائمة الأصناف' },
  ];

  const handleNav = (id) => {
    onNavigate(id);
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header / Logo */}
      <div className="px-5 py-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-xl shadow-lg shadow-brand-500/20">
            👑
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">مطعم القيصر</h1>
            <p className="text-gray-500 text-xs">لوحة الإدارة</p>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center text-lg transition-colors"
            title="إغلاق"
          >
            ✕
          </button>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => handleNav(item.id)}
            className={`sidebar-link w-full text-right ${active === item.id ? 'active' : ''}`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1 font-medium">{item.label}</span>
            {item.badge > 0 && (
              <span className="bg-brand-500 text-white text-xs px-2 py-0.5 rounded-full font-bold animate-pulse-soft">
                {item.badge}
              </span>
            )}
          </button>
        ))}

        <div className="pt-4 mt-4 border-t border-white/5">
          <a
            href={import.meta.env.VITE_CUSTOMER_URL || '../customer/index.html'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-500/15 to-brand-700/15 text-brand-400 border border-brand-500/30 hover:from-brand-500 hover:to-brand-600 hover:text-white transition-all shadow-md text-right w-full"
          >
            <span className="text-lg">🛒</span>
            <span className="flex-1">واجهة طلب العميل</span>
            <span className="text-xs">↗</span>
          </a>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/5 flex items-center justify-between bg-dark-900/40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse-soft" />
          <span className="text-gray-400 text-xs font-medium">متصل</span>
        </div>
        <button
          onClick={() => { if (onClose) onClose(); onLogout(); }}
          title="تسجيل الخروج"
          className="text-gray-400 hover:text-red-400 text-xs transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5 flex items-center gap-1.5"
        >
          <span>خروج</span>
          <span>🚪</span>
        </button>
      </div>
    </div>
  );
}

// ── Dashboard Overview ─────────────────────────────────────────────────────────
function DashboardOverview({ stats }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white">مرحباً بك 👋</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">نظرة عامة على أداء المطعم اليوم</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <StatCard icon="🧾" label="إجمالي الطلبات"   value={stats.total}      sub="اليوم"   color="brand"  />
        <StatCard icon="⏳" label="جارِ الانتظار"    value={stats.pending}    sub="1-2 د"   color="yellow" />
        <StatCard icon="👨‍🍳" label="قيد التحضير"   value={stats.preparing}  sub="25-45 د" color="blue"   />
        <StatCard icon="🛵" label="مع المندوب"      value={stats.delivering} sub="10-20 د" color="purple" />
        <div className="col-span-2 sm:col-span-1">
          <StatCard icon="✅" label="تم التسليم"       value={stats.delivered}  sub="مكتمل"   color="green"  />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="card">
          <h3 className="text-white font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
            <span className="text-brand-400">💰</span> إجمالي الإيرادات
          </h3>
          <div className="text-2xl sm:text-4xl font-bold text-brand-400">{stats.revenue.toFixed(0)}</div>
          <div className="text-gray-500 text-xs sm:text-sm mt-1">جنيه مصري</div>
        </div>
        <div className="card">
          <h3 className="text-white font-bold text-sm sm:text-base mb-3 flex items-center gap-2">
            <span className="text-blue-400">📈</span> متوسط قيمة الطلب
          </h3>
          <div className="text-2xl sm:text-4xl font-bold text-blue-400">
            {stats.total > 0 ? (stats.revenue / stats.total).toFixed(0) : 0}
          </div>
          <div className="text-gray-500 text-xs sm:text-sm mt-1">جنيه مصري</div>
        </div>
      </div>

      {/* Quick guide */}
      <div className="card border-brand-500/10 bg-gradient-to-br from-brand-500/5 to-transparent">
        <h3 className="text-white font-bold text-sm sm:text-base mb-3">🚀 دليل سريع</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs sm:text-sm text-gray-400">
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
  const [page,        setPage]        = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuth,      setIsAuth]      = useState(() => sessionStorage.getItem('qaysar_admin_auth') === 'true');
  const [stats,       setStats]       = useState({ total: 0, pending: 0, preparing: 0, delivering: 0, delivered: 0, revenue: 0 });

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

  const pageTitles = {
    dashboard: 'لوحة التحكم',
    orders:    'الطلبات',
    menu:      'قائمة الأصناف',
  };

  const renderPage = () => {
    switch (page) {
      case 'orders':    return <OrdersPanel />;
      case 'menu':      return <MenuPanel />;
      default:          return <DashboardOverview stats={stats} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900 text-gray-200">
      {!isAuth && <LoginModal onLogin={setIsAuth} />}

      {/* ── Desktop Permanent Sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 bg-dark-800 border-l border-white/5 flex-col min-h-screen sticky top-0 h-screen z-30">
        <SidebarContent
          active={page}
          onNavigate={setPage}
          ordersCount={stats.pending}
          onLogout={handleLogout}
          isMobile={false}
        />
      </aside>

      {/* ── Mobile Drawer Sidebar ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-72 max-w-[85vw] bg-dark-800 border-l border-white/10 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <SidebarContent
          active={page}
          onNavigate={setPage}
          ordersCount={stats.pending}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
          isMobile={true}
        />
      </aside>

      {/* ── Main Content Area ── */}
      <main className="flex-1 min-w-0 overflow-x-hidden flex flex-col">
        {/* Sticky Top Bar */}
        <header className="sticky top-0 z-30 bg-dark-900/90 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 md:px-8 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 transition-colors relative flex items-center justify-center"
              aria-label="فتح القائمة"
            >
              <span className="text-xl leading-none">☰</span>
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                  {stats.pending}
                </span>
              )}
            </button>

            {/* Title / Breadcrumb */}
            <div className="flex items-center gap-2 sm:gap-3 text-sm">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex md:hidden items-center justify-center text-sm shadow-md">
                👑
              </span>
              <span className="text-gray-400 hidden sm:inline">لوحة الإدارة</span>
              <span className="text-gray-700 hidden sm:inline">/</span>
              <span className="text-white font-bold text-base sm:text-sm">
                {pageTitles[page]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Direct Customer Link for Tablet/Desktop */}
            <a
              href={import.meta.env.VITE_CUSTOMER_URL || '../customer/index.html'}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20 hover:bg-brand-500 hover:text-white transition-all"
            >
              <span>🛒</span>
              <span>صفحة العميل</span>
              <span className="text-[10px]">↗</span>
            </a>

            {/* Date Display */}
            <div className="text-gray-500 text-xs hidden lg:block">
              {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <div className="p-3 sm:p-5 md:p-8 pb-24 md:pb-8 flex-1">
          {renderPage()}
        </div>

        {/* ── Mobile Bottom Navigation Bar (Phone Thumb Friendly) ── */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-dark-800/95 backdrop-blur-lg border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl">
          <button
            onClick={() => setPage('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              page === 'dashboard' ? 'text-brand-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="text-lg">📊</span>
            <span className="text-[11px] mt-0.5">الرئيسية</span>
          </button>

          <button
            onClick={() => setPage('orders')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              page === 'orders' ? 'text-brand-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <div className="relative">
              <span className="text-lg">🧾</span>
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-2 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center">
                  {stats.pending}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5">الطلبات</span>
          </button>

          <button
            onClick={() => setPage('menu')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              page === 'menu' ? 'text-brand-400 font-bold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span className="text-lg">🍽️</span>
            <span className="text-[11px] mt-0.5">الأصناف</span>
          </button>

          <a
            href={import.meta.env.VITE_CUSTOMER_URL || '../customer/index.html'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-brand-400/80 hover:text-brand-400 transition-all"
          >
            <span className="text-lg">🛒</span>
            <span className="text-[11px] mt-0.5">طلب العميل</span>
          </a>
        </nav>
      </main>
    </div>
  );
}
