import { useEffect } from 'react'
import { supabase } from '../supabaseClient'

// Deteksi zona waktu perangkat (mis. 'Asia/Jakarta', 'Asia/Makassar', 'Asia/Jayapura')
// lalu simpan ke user_settings.timezone bila berubah. Edge Function pakai nilai ini
// untuk memformat jam di notifikasi sesuai zona user saat itu — jadi otomatis benar
// walau pindah kota (WIB/WITA/WIT). Hanya menulis bila beda, supaya tak memicu
// refetch realtime yang tak perlu.
export function useSyncTimezone() {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!tz) return

    let cancelled = false
    supabase
      .from('user_settings')
      .select('timezone')
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error) return
        if (data?.timezone !== tz) {
          supabase.from('user_settings').upsert({ timezone: tz }, { onConflict: 'user_id' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])
}
