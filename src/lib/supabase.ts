import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

export const supabaseConfigured = Boolean(url && key)

if (!supabaseConfigured) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY fehlen (siehe .env.example).')
}

// Default-Einstellungen: persistSession + detectSessionInUrl sind an.
export const supabase = createClient<Database>(
  url ?? 'http://localhost:54321',
  key ?? 'missing-key',
)
