import React, { useState } from 'react';

export default function LoginModal({ onLogin }) {
  const [pass, setPass] = useState('');
  const [err, setErr]   = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // كود دخول بسيط وقابل للتغيير
    const validPass = import.meta.env.VITE_ADMIN_PASSWORD || 'qaysar2026';
    if (pass === validPass) {
      sessionStorage.setItem('qaysar_admin_auth', 'true');
      onLogin(true);
    } else {
      setErr('كلمة المرور غير صحيحة، حاول مجدداً');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-dark-800 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl text-center animate-slide-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-3xl shadow-lg">
          👑
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">مطعم القيصر</h2>
        <p className="text-gray-400 text-sm mb-6">تسجيل الدخول إلى لوحة الإدارة</p>

        {err && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 text-right">
            ⚠️ {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-right">
            <label className="block text-gray-400 text-xs mb-1">كلمة المرور</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors text-center text-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-brand-500/20"
          >
            دخول 🔐
          </button>
        </form>
      </div>
    </div>
  );
}
