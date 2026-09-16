// ── Middleware: Input Validation للطلبات ──────────────────────────────────────

// دالة مساعدة للتحقق من أرقام الهواتف (خاصة المصرية: 010, 011, 012, 015)
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  // رقم مصري ببادئة دولية +20 أو 0020 أو يبدأ بـ 01
  const egRegex = /^(?:\+?20|0020|0)?1[0125][0-9]{8}$/;
  // دعم أرقام الهواتف العامة بحد أدنى 10 أرقام وأقصى 15 رقماً
  const generalRegex = /^\+?[0-9]{10,15}$/;
  return egRegex.test(clean) || generalRegex.test(clean);
}

// تنظيف النصوص لمنع XSS والرموز الخطيرة
function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

// التحقق من صحة مصفوفة الأصناف وتأكيد الأسعار
function validateItemsList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: 'يجب اختيار صنف واحد على الأقل في السلة' };
  }
  if (items.length > 50) {
    return { valid: false, message: 'الحد الأقصى للأصناف في الطلب الواحد هو 50 صنفاً' };
  }

  const cleanItems = [];
  let calculatedTotal = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it || typeof it !== 'object') {
      return { valid: false, message: `بيانات الصنف رقم ${i + 1} غير صالحة` };
    }

    const name = sanitizeText(it.name || '');
    if (!name || name.length < 1 || name.length > 100) {
      return { valid: false, message: `اسم الصنف رقم ${i + 1} غير صالح` };
    }

    const price = Number(it.price);
    if (isNaN(price) || price < 0 || price > 50000) {
      return { valid: false, message: `سعر الصنف "${name}" غير صحيح` };
    }

    const rawQty = it.quantity !== undefined ? it.quantity : it.qty;
    const qty = parseInt(rawQty, 10);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return { valid: false, message: `الكمية للصنف "${name}" يجب أن تكون بين 1 و 100` };
    }

    calculatedTotal += price * qty;
    cleanItems.push({
      id:       it.id ? parseInt(it.id, 10) : null,
      name,
      price:    Math.round(price * 100) / 100,
      qty,
      quantity: qty
    });
  }

  return {
    valid: true,
    items: cleanItems,
    total: Math.round(calculatedTotal * 100) / 100
  };
}

// Validation لإنشاء طلب جديد
function validateCreateOrder(req, res, next) {
  const { customer_name, customer_phone, customer_address, items, notes } = req.body;

  // 1. الاسم
  const name = sanitizeText(customer_name || '');
  if (!name || name.length < 2) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال اسم العميل (حرفين على الأقل)' });
  }
  if (name.length > 60) {
    return res.status(400).json({ success: false, message: 'اسم العميل طويل جداً (الحد الأقصى 60 حرفاً)' });
  }

  // 2. الهاتف
  const phone = sanitizeText(customer_phone || '');
  if (!phone) {
    return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب لتأكيد التوصيل' });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'رقم الهاتف غير صحيح. يرجى إدخال رقم هاتف صالح (مثال: 01012345678)'
    });
  }

  // 3. العنوان
  const address = sanitizeText(customer_address || '');
  if (!address || address.length < 4) {
    return res.status(400).json({ success: false, message: 'الرجاء إدخال عنوان التوصيل بالتفصيل' });
  }
  if (address.length > 250) {
    return res.status(400).json({ success: false, message: 'العنوان طويل جداً (الحد الأقصى 250 حرفاً)' });
  }

  // 4. الأصناف
  const itemsValidation = validateItemsList(items);
  if (!itemsValidation.valid) {
    return res.status(400).json({ success: false, message: itemsValidation.message });
  }

  // 5. الملاحظات (اختياري)
  const cleanNotes = notes ? sanitizeText(notes).slice(0, 300) : '';

  // تخزين البيانات المنقحة والآمنة لاستخدامها في الـ Handler
  req.validatedOrder = {
    customer_name:    name,
    customer_phone:   phone,
    customer_address: address,
    items:            itemsValidation.items,
    total_amount:     itemsValidation.total,
    notes:            cleanNotes
  };

  next();
}

// Validation لتعديل طلب موجود (إضافة أو تقليل أصناف)
function validateUpdateOrder(req, res, next) {
  const { items, notes, customer_address, customer_phone } = req.body;

  const itemsValidation = validateItemsList(items);
  if (!itemsValidation.valid) {
    return res.status(400).json({ success: false, message: itemsValidation.message });
  }

  const updates = {
    items:        itemsValidation.items,
    total_amount: itemsValidation.total,
  };

  if (notes !== undefined) {
    updates.notes = sanitizeText(notes).slice(0, 300);
  }
  if (customer_address) {
    const address = sanitizeText(customer_address);
    if (address.length >= 4 && address.length <= 250) updates.customer_address = address;
  }
  if (customer_phone && isValidPhone(customer_phone)) {
    updates.customer_phone = sanitizeText(customer_phone);
  }

  req.validatedOrderUpdate = updates;
  next();
}

module.exports = {
  isValidPhone,
  sanitizeText,
  validateCreateOrder,
  validateUpdateOrder
};
