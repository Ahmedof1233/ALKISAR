import React, { useEffect, useState, useCallback, useRef } from 'react';
import { API_BASE, CATEGORIES } from '../constants';

const IMG_BASE = 'http://localhost:3001';

// ── Modal إضافة / تعديل صنف ───────────────────────────────────────────────
function ItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({
    name:        item?.name        || '',
    description: item?.description || '',
    price:       item?.price       || '',
    category:    item?.category    || 'عام',
    available:   item?.available   ?? 1,
  });
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState(item?.image_url ? `${IMG_BASE}${item.image_url}` : null);
  const [uploading,    setUploading]    = useState(false);
  const fileInputRef = useRef();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? (checked ? 1 : 0) : value }));
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) { setError('الاسم والسعر مطلوبان'); return; }
    setSaving(true);
    setError('');
    try {
      // 1. حفظ بيانات الصنف
      const url    = item ? `${API_BASE}/items/${item.id}` : `${API_BASE}/items`;
      const method = item ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ...form, price: parseFloat(form.price) }),
      });
      const json = await res.json();
      if (!json.success) { setError(json.message); return; }

      let savedItem = json.data;

      // 2. رفع الصورة إن وجدت
      if (imageFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('image', imageFile);
        const imgRes  = await fetch(`${API_BASE}/items/${savedItem.id}/image`, { method: 'POST', body: fd });
        const imgJson = await imgRes.json();
        if (imgJson.success) savedItem = imgJson.data;
        setUploading(false);
      }

      onSave(savedItem, !!item);
      onClose();
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-md animate-slide-in border-white/10 my-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            {item ? '✏️ تعديل الصنف' : '➕ إضافة صنف جديد'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl transition-colors">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* صورة الصنف */}
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">صورة الصنف</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-36 rounded-xl border-2 border-dashed border-white/10 hover:border-brand-500/40
                         flex items-center justify-center cursor-pointer overflow-hidden transition-colors group bg-dark-700"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-gray-400">
                  <span className="text-3xl">🖼️</span>
                  <span className="text-sm">اضغط لرفع صورة</span>
                  <span className="text-xs">PNG, JPG, WebP — حجم أقصى 5MB</span>
                </div>
              )}
              {imagePreview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-sm font-bold">🖼️ تغيير الصورة</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} className="hidden" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">اسم الصنف *</label>
            <input id="input-item-name" name="name" value={form.name} onChange={handleChange}
              className="input-field" placeholder="مثال: كبسة لحم" />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">الوصف</label>
            <textarea id="input-item-desc" name="description" value={form.description} onChange={handleChange}
              className="input-field resize-none" rows={2} placeholder="وصف مختصر للصنف..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">السعر (ج.م) *</label>
              <input id="input-item-price" name="price" type="number" min="0" step="0.5"
                value={form.price} onChange={handleChange}
                className="input-field" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">التصنيف</label>
              <select id="select-item-category" name="category" value={form.category} onChange={handleChange}
                className="input-field">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-dark-700 rounded-xl px-4 py-3">
            <input id="check-item-available" type="checkbox" name="available"
              checked={form.available === 1} onChange={handleChange}
              className="w-4 h-4 accent-brand-500" />
            <label htmlFor="check-item-available" className="text-gray-300 text-sm cursor-pointer">
              الصنف متاح للطلب
            </label>
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button id="btn-save-item" type="submit" disabled={saving || uploading} className="flex-1 btn-primary disabled:opacity-50">
              {uploading ? '⬆️ جاري رفع الصورة...' : saving ? '⏳ جاري الحفظ...' : item ? '💾 حفظ التعديلات' : '➕ إضافة الصنف'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── بطاقة الصنف ──────────────────────────────────────────────────
function ItemCard({ item, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`هل تريد حذف "${item.name}"؟`)) return;
    setDeleting(true);
    try {
      await fetch(`${API_BASE}/items/${item.id}`, { method: 'DELETE' });
      onDelete(item.id);
    } finally {
      setDeleting(false);
    }
  };

  const imgSrc = item.image_url ? `http://localhost:3001${item.image_url}` : null;

  return (
    <div className={`card group hover:border-white/10 transition-all duration-300 overflow-hidden p-0 flex flex-col justify-between ${!item.available ? 'opacity-60' : ''}`}>
      <div>
        {/* صورة الصنف */}
        {imgSrc ? (
          <div className="relative h-40 overflow-hidden bg-dark-700">
            <img src={imgSrc} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute top-2 right-2">
              <span className="text-xs bg-dark-800/80 backdrop-blur-sm text-gray-300 px-2.5 py-1 rounded-lg border border-white/10">{item.category}</span>
            </div>
          </div>
        ) : (
          <div className="h-24 bg-gradient-to-br from-dark-700 to-dark-600 flex items-center justify-center">
            <span className="text-3xl opacity-40">🍽️</span>
          </div>
        )}

        <div className="p-4 pb-2">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {!imgSrc && (
                  <span className="text-xs bg-dark-600 text-gray-400 px-2 py-0.5 rounded-lg">{item.category}</span>
                )}
                {!item.available && (
                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-lg border border-red-500/20">
                    غير متاح
                  </span>
                )}
              </div>
              <h4 className="font-bold text-white text-base truncate">{item.name}</h4>
            </div>
            <div className="text-brand-400 font-bold text-lg whitespace-nowrap">
              {item.price} ج.م
            </div>
          </div>

          {item.description && (
            <p className="text-gray-400 text-xs line-clamp-2 mb-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0">
        <div className="flex items-center gap-2 pt-3 border-t border-white/5">
          <button
            id={`btn-edit-item-${item.id}`}
            onClick={() => onEdit(item)}
            className="flex-1 btn-ghost text-sm py-1.5 flex items-center justify-center gap-1.5"
          >
            <span>✏️</span>
            <span>تعديل</span>
          </button>
          <button
            id={`btn-delete-item-${item.id}`}
            onClick={handleDelete}
            disabled={deleting}
            className="btn-danger text-sm py-1.5 px-3 disabled:opacity-50"
            title="حذف الصنف"
          >
            {deleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel الرئيسي ─────────────────────────────────────────────────────────────
export default function MenuPanel() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editItem,    setEditItem]    = useState(null);
  const [search,      setSearch]      = useState('');
  const [catFilter,   setCatFilter]   = useState('الكل');

  const fetchItems = useCallback(async () => {
    try {
      const res  = await fetch(`${API_BASE}/items`);
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch (e) {
      console.error('خطأ في جلب الأصناف:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSave = (savedItem, isEdit) => {
    if (isEdit) {
      setItems(prev => prev.map(i => i.id === savedItem.id ? savedItem : i));
    } else {
      setItems(prev => [savedItem, ...prev]);
    }
  };

  const handleDelete = (id) => setItems(prev => prev.filter(i => i.id !== id));

  const openAdd  = () => { setEditItem(null);  setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setShowModal(true); };

  const categories = ['الكل', ...CATEGORIES];
  const filtered = items
    .filter(i => catFilter === 'الكل' || i.category === catFilter)
    .filter(i => !search || i.name.includes(search) || (i.description||'').includes(search));

  return (
    <div className="animate-fade-in">
      {showModal && (
        <ItemModal
          item={editItem}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">قائمة الأصناف</h2>
          <p className="text-gray-500 text-sm mt-1">{items.length} صنف مسجّل</p>
        </div>
        <button id="btn-add-item" onClick={openAdd} className="btn-primary flex items-center gap-2">
          ➕ إضافة صنف
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          id="input-search-items"
          type="text"
          placeholder="🔍 ابحث عن صنف..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field sm:max-w-xs"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200
                ${catFilter === cat
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'bg-dark-700 text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card h-36 animate-pulse bg-dark-700" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-600">
          <span className="text-6xl mb-4">🍴</span>
          <p className="text-lg font-medium">لا توجد أصناف</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(item => (
            <ItemCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
