import { createClient } from '@supabase/supabase-js'

// ربط مباشر برابط مشروعك ومفتاح الـ Anon لتجنب مشاكل قراءة البيئة في Vercel
const supabaseUrl = "https://lwrvgrlnnfpdmualyow.supabase.co"
const supabaseAnonKey = "sb_publishable_TjA0lDg9tJoLNbyYmgbAoW_RIPgXnxw"
export const supabase = createClient(supabaseUrl, supabaseAnonKey)