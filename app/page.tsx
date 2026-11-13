import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import StoreFront from './StoreFront'

async function ProductList() {
  const { data: products, error } = await supabase.from('clothes').select('*')

  if (error) {
    return (
      <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
        خطأ في جلب البيانات: {error.message}
      </div>
    )
  }

  return <StoreFront products={products || []} />
}

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <Suspense fallback={<div className="text-center p-8">جاري تحميل المنتجات...</div>}>
          <ProductList />
        </Suspense>
      </div>
    </main>
  )
}