import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export function useInboxCount() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    const { count } = await supabase
      .from('inbox_items')
      .select('*', { count: 'exact', head: true })
      .eq('processed', false)
    setCount(count ?? 0)
  }, [])

  useEffect(() => {
    fetchCount()
  }, [fetchCount])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('inbox-count-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inbox_items', filter: `user_id=eq.${user.id}` },
        fetchCount,
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, fetchCount])

  return count
}
