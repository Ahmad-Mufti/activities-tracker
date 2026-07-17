import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from './AuthContext'

const SemesterContext = createContext(undefined)

export function SemesterProvider({ children }) {
  const { user } = useAuth()
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchSemesters = useCallback(async () => {
    const { data, error } = await supabase
      .from('semesters')
      .select('*')
      .order('start_date', { ascending: false })
    if (!error) setSemesters(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!user) return
    fetchSemesters()

    const channel = supabase
      .channel('semesters-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'semesters', filter: `user_id=eq.${user.id}` },
        fetchSemesters,
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user, fetchSemesters])

  const activeSemester = semesters.find((s) => s.is_active) ?? null

  async function createSemester({ name, start_date, end_date }) {
    const shouldBeActive = semesters.length === 0 || !semesters.some((s) => s.is_active)
    const { error } = await supabase
      .from('semesters')
      .insert({ name, start_date, end_date, is_active: shouldBeActive })
    if (error) throw error
  }

  async function updateSemester(id, fields) {
    const { error } = await supabase.from('semesters').update(fields).eq('id', id)
    if (error) throw error
  }

  async function deleteSemester(id) {
    const { error } = await supabase.from('semesters').delete().eq('id', id)
    if (error) throw error
  }

  async function setActive(id) {
    const { error: offError } = await supabase
      .from('semesters')
      .update({ is_active: false })
      .neq('id', id)
    if (offError) throw offError

    const { error: onError } = await supabase
      .from('semesters')
      .update({ is_active: true })
      .eq('id', id)
    if (onError) throw onError
  }

  const value = {
    semesters,
    activeSemester,
    loading,
    createSemester,
    updateSemester,
    deleteSemester,
    setActive,
  }

  return <SemesterContext.Provider value={value}>{children}</SemesterContext.Provider>
}

export function useSemesters() {
  const ctx = useContext(SemesterContext)
  if (ctx === undefined) {
    throw new Error('useSemesters harus dipakai di dalam <SemesterProvider>')
  }
  return ctx
}
