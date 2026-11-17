import { useEffect, useRef } from 'react'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type TableName = 'progress' | 'progress_events' | 'user_achievements'
type Row<T extends TableName> = Database['public']['Tables'][T]['Row']

let channelCounter = 0

/** Abonniert INSERT/UPDATE/DELETE einer Tabelle (Realtime muss für sie aktiv sein). */
export function useRealtime<T extends TableName>(
  table: T,
  onChange: (payload: RealtimePostgresChangesPayload<Row<T>>) => void,
) {
  const cb = useRef(onChange)
  useEffect(() => {
    cb.current = onChange
  })

  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}-${++channelCounter}`)
      .on<Row<T>>('postgres_changes', { event: '*', schema: 'public', table }, (payload) => cb.current(payload))
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [table])
}
