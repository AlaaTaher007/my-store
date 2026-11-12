'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type OrderItem = {
  name: string
  price: number
  quantity: number
}

type Order = {
  id: number
  created_at: string
  customer_name: string
  phone: string
  dress: string
  items: string | OrderItem[]
  status: string
  total_price: number
}

type Product = {
  id: number
  name: string
  price: number
  discount_price?: number
  image_url?: string
  stock: number
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [discountPrice, setDiscountPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [stock, setStock] = useState('')

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setIsAuthenticated(true)
      fetchData()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCheckingAuth(true)

    const { data, error } = await supabase
      .from('settings')
      .select('admin_password')
      .limit(1)
      .single()

    setCheckingAuth(false)

    if (!error && data && passwordInput === data.admin_password) {
      setIsAuthenticated(true)
      setAuthError(false)
      sessionStorage.setItem('admin_auth', 'true')
      fetchData()
    } else {
      setAuthError(true)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    sessionStorage.removeItem('admin_auth')
    setPasswordInput('')
  }

  const fetchData = async () => {
    setLoading(true)
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    const { data: productsData } = await supabase
      .from('clothes')
      .select('*')
      .order('id', { ascending: false })

    setOrders(ordersData || [])
    setProducts(productsData || [])
    setLoading(false)
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.from('clothes').insert([
      {
        name,
        price: parseFloat(price),
        discount_price: discountPrice ? parseFloat(discountPrice) : null,
        image_url: imageUrl,
        stock: parseInt(stock),
      },
    ])

    if (error) {
      alert('خطأ في إضافة المنتج: ' + error.message)
    } else {
      alert('تمت إضافة المنتج بنجاح!')
      setName('')
      setPrice('')
      setDiscountPrice('')
      setImageUrl('')
      setStock('')
      fetchData()
    }
  }

  const handleDeleteProduct = async (id: number) => {
    if (confirm('هل أنتِ متأكدة من حذف هذا المنتج من المتجر؟')) {
      const { error } = await supabase.from('clothes').delete().eq('id', id)
      if (error) {
        alert('خطأ في الحذف: ' + error.message)
      } else {
        fetchData()
      }
    }
  }

  const increaseStock = async (product: Product) => {
    const newStock = product.stock + 1
    const { error } = await supabase
      .from('clothes')
      .update({ stock: newStock })
      .eq('id', product.id)

    if (!error) fetchData()
  }

  const decreaseStock = async (product: Product) => {
    if (product.stock <= 0) return
    const newStock = product.stock - 1
    const { error } = await supabase
      .from('clothes')
      .update({ stock: newStock })
      .eq('id', product.id)

    if (!error) fetchData()
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.trim().length < 4) {
      alert('الرجاء إدخال كلمة مرور لا تقل عن 4 أحرف أو أرقام.')
      return
    }

    const { data: currentRow } = await supabase
      .from('settings')
      .select('id')
      .limit(1)
      .single()

    if (currentRow) {
      const { error } = await supabase
        .from('settings')
        .update({ admin_password: newPassword.trim() })
        .eq('id', currentRow.id)

      if (error) {
        alert('حدث خطأ أثناء تغيير كلمة المرور: ' + error.message)
      } else {
        alert('تم تغيير كلمة المرور بنجاح! استخدم الكلمة الجديدة في المرة القادمة.')
        setNewPassword('')
      }
    }
  }

  const toggleOrderStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'تمت' ? 'جديد' : 'تمت'
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id)
    if (!error) fetchData()
  }

  const parseItems = (items: string | OrderItem[]): OrderItem[] => {
    if (typeof items === 'string') {
      try {
        return JSON.parse(items)
      } catch {
        return []
      }
    }
    return items || []
  }

  // شاشة قفل الأدمن إذا لم يتم تسجيل الدخول
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full border border-gray-200">
          <div className="text-center mb-6">
            <span className="text-4xl">🔐</span>
            <h1 className="text-2xl font-bold text-gray-800 mt-3">دخول الإدارة</h1>
            <p className="text-sm text-gray-500 mt-1">أدخل كلمة المرور للوصول إلى لوحة التحكم</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              required
              placeholder="كلمة المرور..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 text-center text-lg focus:outline-indigo-600"
            />
            {authError && (
              <p className="text-red-500 text-xs text-center font-semibold">
                كلمة المرور غير صحيحة
              </p>
            )}
            <button
              type="submit"
              disabled={checkingAuth}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition cursor-pointer"
            >
              {checkingAuth ? 'جاري التحقق...' : 'دخول'}
            </button>
          </form>
        </div>
      </main>
    )
  }

  const pendingOrders = orders.filter((o) => o.status !== 'تمت')
  const completedOrders = orders.filter((o) => o.status === 'تمت')

  const dailySales: { [key: string]: number } = {}
  orders.forEach((order) => {
    const day = new Date(order.created_at).toLocaleDateString('default', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    dailySales[day] = (dailySales[day] || 0) + Number(order.total_price || 0)
  })

  const monthlySales: { [key: string]: number } = {}
  orders.forEach((order) => {
    const month = new Date(order.created_at).toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    })
    monthlySales[month] = (monthlySales[month] || 0) + Number(order.total_price || 0)
  })

  return (
    <main className="min-h-screen p-8 bg-gray-100">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">لوحة تحكم الإدارة الشاملة 🛠️</h1>
            <p className="text-gray-500 mt-1">إدارة المنتجات، الطلبات، وتحليلات المبيعات اليومية والشهرية</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition cursor-pointer"
            >
              🔄 تحديث البيانات
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-medium hover:bg-red-100 transition cursor-pointer"
            >
              قفل اللوحة 🔒
            </button>
          </div>
        </header>

        {/* إحصائيات المبيعات اليومية والشهرية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📅 إحصائيات المبيعات اليومية</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {Object.keys(dailySales).length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد مبيعات مسجلة حتى الآن.</p>
              ) : (
                Object.entries(dailySales).map(([day, total], idx) => (
                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border">
                    <span className="text-sm font-medium text-gray-600">{day}</span>
                    <span className="text-lg font-bold text-indigo-600">{total} د.ل</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">📊 إحصائيات المبيعات الشهرية</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {Object.keys(monthlySales).length === 0 ? (
                <p className="text-gray-500 text-sm">لا توجد مبيعات مسجلة حتى الآن.</p>
              ) : (
                Object.entries(monthlySales).map(([month, total], idx) => (
                  <div key={idx} className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                    <span className="text-sm font-medium text-gray-600">{month}</span>
                    <span className="text-lg font-bold text-indigo-600">{total} د.ل</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* إدارة وتعديل المنتجات الحالية والمخزون */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📦 إدارة منتجات المتجر والمخزون</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {products.map((prod) => (
              <div key={prod.id} className="border p-4 rounded-xl flex flex-col justify-between bg-gray-50 gap-4">
                <div className="flex items-center gap-3">
                  {prod.image_url && <img src={prod.image_url} alt={prod.name} className="w-14 h-14 object-cover rounded-lg" />}
                  <div>
                    <p className="font-bold text-sm text-gray-800">{prod.name}</p>
                    <p className="text-xs text-indigo-600 font-bold mt-0.5">{prod.price} د.ل</p>
                  </div>
                </div>

                {/* تعديل الكمية زيادة ونقصان */}
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border">
                  <span className="text-xs text-gray-600 font-medium">المخزن:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => decreaseStock(prod)}
                      className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 rounded font-bold text-xs cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold">{prod.stock}</span>
                    <button
                      onClick={() => increaseStock(prod)}
                      className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 rounded font-bold text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteProduct(prod.id)}
                  className="w-full bg-red-50 text-red-600 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition cursor-pointer"
                >
                  حذف المنتج نهائياً 🗑️
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* نموذج إضافة منتج جديد */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">➕ إضافة منتج جديد للمتجر</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              placeholder="اسم المنتج"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2.5 rounded-lg"
            />
            <input
              type="number"
              required
              placeholder="السعر الأساسي (د.ل)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2.5 rounded-lg"
            />
            <input
              type="number"
              placeholder="سعر التخفيض (اختياري)"
              value={discountPrice}
              onChange={(e) => setDiscountPrice(e.target.value)}
              className="border p-2.5 rounded-lg"
            />
            <input
              type="number"
              required
              placeholder="الكمية المتوفرة بالمخزن"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="border p-2.5 rounded-lg"
            />
            <input
              type="text"
              required
              placeholder="رابط الصورة (Image URL)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="border p-2.5 rounded-lg sm:col-span-2"
            />
            <button
              type="submit"
              className="bg-green-600 text-white py-2.5 rounded-lg font-bold hover:bg-green-700 transition cursor-pointer sm:col-span-3"
            >
              حفظ وإضافة المنتج للمتجر
            </button>
          </form>
        </section>

        {/* قسم تغيير كلمة المرور للزبون */}
        <section className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">🔑 تغيير كلمة مرور لوحة التحكم</h2>
          <p className="text-sm text-gray-500 mb-4">
            يمكنك تحديث كلمة المرور الخاصة بالإدارة في أي وقت لضمان خصوصية متجرك.
          </p>
          <form onSubmit={handleChangePassword} className="flex flex-col sm:flex-row gap-4 max-w-lg">
            <input
              type="password"
              required
              placeholder="أدخل كلمة المرور الجديدة..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 border p-2.5 rounded-lg focus:outline-indigo-600"
            />
            <button
              type="submit"
              className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-600 transition cursor-pointer"
            >
              حفظ الكلمة الجديدة
            </button>
          </form>
        </section>

        {/* الطلبات الجديدة */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📥 الطلبات الجديدة (قيد التنفيذ) ({pendingOrders.length})</h2>
          {pendingOrders.length === 0 ? (
            <p className="text-gray-500 py-4">لا توجد طلبات جديدة حالياً.</p>
          ) : (
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="border border-amber-200 bg-amber-50/30 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded">طلب #{order.id}</span>
                    <p className="font-bold text-gray-800 mt-2">
                      👤 {order.customer_name} | 📞 {order.phone} | 📍 {order.dress}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                    <div className="mt-2 text-sm text-gray-700">
                      <strong>المنتجات:</strong> {parseItems(order.items).map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-indigo-600">{order.total_price} د.ل</span>
                    <button
                      onClick={() => toggleOrderStatus(order.id, order.status)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-700 transition cursor-pointer"
                    >
                      تسجيل كـ (تمت) ✓
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* الطلبات المكتملة */}
        <section className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">✅ الطلبات المكتملة والمجابة ({completedOrders.length})</h2>
          {completedOrders.length === 0 ? (
            <p className="text-gray-500 py-4">لا توجد طلبات مكتملة حتى الآن.</p>
          ) : (
            <div className="space-y-4">
              {completedOrders.map((order) => (
                <div key={order.id} className="border border-green-200 bg-green-50/30 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded">طلب #{order.id}</span>
                    <p className="font-bold text-gray-800 mt-2">
                      👤 {order.customer_name} | 📞 {order.phone} | 📍 {order.dress}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-indigo-600">{order.total_price} د.ل</span>
                    <button
                      onClick={() => toggleOrderStatus(order.id, order.status)}
                      className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-600 transition cursor-pointer"
                    >
                      إعادة كـ (جديد)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}