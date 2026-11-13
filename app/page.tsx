import { supabase } from '@/lib/supabase'
import StoreFront from './StoreFront'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const { data: products, error } = await supabase.from('clothes').select('*')

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">
            خطأ في جلب البيانات: {error.message}
          </div>
        )}
        
        <StoreFront products={products || []} />
      </div>
    </main>
  )
}