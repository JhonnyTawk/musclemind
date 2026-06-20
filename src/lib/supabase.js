import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** True when real Supabase credentials are present; otherwise the app
 *  runs in demo mode against seeded in-memory data. */
export const supabaseConfigured = Boolean(url && key)

export const supabase = supabaseConfigured ? createClient(url, key) : null
