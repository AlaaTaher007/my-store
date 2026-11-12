'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

type Product = {
  id: number
  name: string
  price: number
  discount_price?: number
  image_url?: string
  stock: number
}

type CartItem = Product & {
  quantity: number
}

const availableCities = ['طرابلس', 'بنغازي', 'سبها']

export default function StoreFront({ products }: { products: Product[] }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerCity, setCustomerCity] = useState(availableCities[0])
  const [paymentMethod, setPaymentMethod] = useState('الدفع عند الاستلام')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successOrderDetails, setSuccessOrderDetails] = useState<{
    items: CartItem[]
    total: number
    city: string
  } | null>(null)

  // إضافة للسلة
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return
    setSuccessOrderDetails(null)
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id)
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      }
      return [...prevCart, { ...product, quantity: 1 }]
    })
  }

  // تقليل الكمية
  const decreaseQuantity = (productId: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.discount_price || item.price) * item.quantity,
    0
  )

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()

    // التحقق من صحة الاسم (حروف عربية فقط)
    const arabicNameRegex = /^[\u0600-\u06FF\s]+$/
    if (!arabicNameRegex.test(customerName.trim())) {
      alert('الرجاء إدخال الاسم بالحروف العربية فقط.')
      return
    }

    // التحقق من رقم الهاتف (يبدأ بـ 09 وطوله 10 أرقام)
    const phoneRegex = /^09\d{8}$/
    if (!phoneRegex.test(customerPhone.trim())) {
      alert('رقم الهاتف غير صحيح. يجب أن يتكون من 10 أرقام ويبدأ بـ 09.')
      return
    }

    if (cart.length === 0) return

    setIsSubmitting(true)

    const orderData = {
      customer_name: customerName.trim(),
      phone: customerPhone.trim(),
      address: `${customerCity} - الدفع: ${paymentMethod}`, // استخدام dress حسب اسم العمود في قاعدة البيانات
      items: JSON.stringify(cart),
      status: 'جديد',
      total_price: totalPrice, // استخدام total_price بالتهجئة الصحيحة
    }

    const { error } = await supabase.from('orders').insert([orderData])
    

    setIsSubmitting(false)

    if (error) {
      alert('حدث خطأ أثناء إرسال الطلب: ' + error.message)
    } else {
      setSuccessOrderDetails({
        items: [...cart],
        total: totalPrice,
        city: customerCity,
      })
      setCart([])
      setCustomerName('')
      setCustomerPhone('')
    }
  }

  return (
    <div>
      <nav className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm mb-8">
        <h1 className="text-2xl font-bold text-gray-800">متجر العرض الاحترافي 🛍️</h1>
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 cursor-pointer shadow-md"
        >
          <span>🛒 السلة</span>
          <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
            {totalItems}
          </span>
        </button>
      </nav>

      {/* نافذة السلة */}
      {isCartOpen && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 transition-all">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h2 className="text-xl font-bold text-gray-800">سلة التسوق</h2>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer text-lg"
            >
              ✕
            </button>
          </div>

          {/* رسالة تأكيد الطلب مع التفاصيل المطلوبة */}
          {successOrderDetails && (
            <div className="p-5 mb-6 bg-green-50 border border-green-200 text-green-900 rounded-xl space-y-3">
              <h3 className="font-bold text-lg text-green-800 flex items-center gap-2">
                ✅ تم تأكيد طلبك بنجاح!
              </h3>
              <p className="text-sm">شكراً لكِ. تفاصيل طلبك كالتالي:</p>
              <div className="bg-white p-3 rounded-lg border border-green-100 text-sm space-y-1">
                <p>📍 <strong>منطقة التوصيل:</strong> {successOrderDetails.city}</p>
                <p>💰 <strong>إجمالي السعر:</strong> {successOrderDetails.total} د.ل</p>
                <div>
                  <strong>المنتجات:</strong>
                  <ul className="list-disc list-inside mt-1 text-gray-600">
                    {successOrderDetails.items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} (الكمية: {item.quantity}) - السعر: {item.discount_price || item.price} د.ل
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {cart.length === 0 && !successOrderDetails ? (
            <p className="text-gray-500 text-center py-4">السلة فارغة حالياً.</p>
          ) : cart.length > 0 ? (
            <div>
              <ul className="divide-y divide-gray-100 mb-4">
                {cart.map((item, idx) => (
                  <li key={idx} className="py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{item.name}</p>
                        <p className="text-sm text-indigo-600 font-bold">
                          {item.discount_price || item.price} د.ل
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-200 font-bold cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => addToCart(item)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-200 font-bold cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="border-t pt-4 mb-6 flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">الإجمالي:</span>
                <span className="text-xl font-bold text-indigo-600">{totalPrice} د.ل</span>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <h3 className="font-semibold text-gray-700">بيانات التوصيل والدفع:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">الاسم (حروف عربية فقط)</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: آلاء طاهر"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-gray-800 focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">رقم الهاتف (يبدأ بـ 09، 10 أرقام)</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="09xxxxxxxx"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-gray-800 focus:outline-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">المنطقة المتوفرة للتوصيل</label>
                    <select
                      value={customerCity}
                      onChange={(e) => setCustomerCity(e.target.value)}
                      className="w-full border rounded-lg p-2.5 text-gray-800 focus:outline-indigo-600 bg-white"
                    >
                      {availableCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* خيارات طريقة الدفع */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">طريقة الدفع:</label>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="الدفع عند الاستلام"
                        checked={paymentMethod === 'الدفع عند الاستلام'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>الدفع عند الاستلام</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="payment"
                        value="تحويل مصرفي"
                        checked={paymentMethod === 'تحويل مصرفي'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span>تحويل مصرفي</span>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition cursor-pointer"
                >
                  {isSubmitting ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      )}

      {/* شبكة المنتجات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white p-4 rounded-xl shadow-md border border-gray-100 flex flex-col justify-between transform transition duration-300 hover:-translate-y-2 hover:shadow-xl relative overflow-hidden"
          >
            {product.stock <= 0 && (
              <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow">
                نفدت الكمية ❌
              </div>
            )}
            {product.discount_price && product.stock > 0 && (
              <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow">
                تخفيض 🔥
              </div>
            )}

            <div>
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-lg mb-4 transition duration-500 hover:scale-105"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>

              <div className="flex items-center gap-2 mt-2">
                {product.discount_price ? (
                  <>
                    <span className="text-indigo-600 font-bold text-lg">{product.discount_price} د.ل</span>
                    <span className="text-gray-400 line-through text-sm">{product.price} د.ل</span>
                  </>
                ) : (
                  <span className="text-indigo-600 font-bold text-lg">{product.price} د.ل</span>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-1">المتبقي بالمخزن: {product.stock} قطع</p>
            </div>

            <button
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`mt-4 w-full py-2 rounded-lg font-medium transition cursor-pointer ${
                product.stock > 0
                  ? 'bg-gray-900 text-white hover:bg-indigo-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {product.stock > 0 ? '+ أضف إلى السلة' : 'غير متوفر حالياً'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}