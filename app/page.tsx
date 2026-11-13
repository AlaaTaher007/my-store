"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import StoreFront from './StoreFront'

export default function Home() {
  const [products, setProducts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('clothes').select('*')
      if (error) {
        setError(error.message)
      } else {
        setProducts(data || [])
      }
      setLoading(false)
    }
    fetchProducts()
  }, [])

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            خطأ في جلب البيانات: {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center p-8">جاري تحميل المنتجات...</div>
        ) : (
          <StoreFront products={products} />
        )}
      </div>
    </main>
  )
}