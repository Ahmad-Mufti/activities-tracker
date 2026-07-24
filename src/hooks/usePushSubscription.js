import { useCallback, useEffect, useState } from 'react'
import { getPushSubscriptionState, subscribeToPush, unsubscribeFromPush, PUSH_CONFIGURED } from '../lib/push'

const SUPPORTED =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window

// Satu sumber kebenaran untuk status notifikasi push di device ini:
//   subscribed = apakah sedang nyala, enable/disable = nyalakan/matikan.
// Dipakai oleh saklar di Pengaturan maupun nudge di Dashboard.
export function usePushSubscription() {
  const [permission, setPermission] = useState(SUPPORTED ? Notification.permission : 'unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(SUPPORTED)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!SUPPORTED) {
      setLoading(false)
      return
    }
    let active = true
    getPushSubscriptionState().then((isSub) => {
      if (!active) return
      setSubscribed(isSub)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const enable = useCallback(async () => {
    setError('')
    setBusy(true)
    try {
      let perm = Notification.permission
      if (perm === 'default') {
        perm = await Notification.requestPermission()
      }
      setPermission(perm)
      if (perm !== 'granted') {
        setBusy(false)
        return
      }
      const res = await subscribeToPush()
      if (!res.ok) {
        setError(res.error || 'Gagal mengaktifkan notifikasi.')
      } else {
        setSubscribed(true)
      }
    } catch (e) {
      setError(e?.message || String(e))
    }
    setBusy(false)
  }, [])

  const disable = useCallback(async () => {
    setError('')
    setBusy(true)
    try {
      const res = await unsubscribeFromPush()
      if (!res.ok) {
        setError(res.error || 'Gagal mematikan notifikasi.')
      } else {
        setSubscribed(false)
      }
    } catch (e) {
      setError(e?.message || String(e))
    }
    setBusy(false)
  }, [])

  return {
    supported: SUPPORTED,
    configured: PUSH_CONFIGURED,
    permission,
    subscribed,
    loading,
    busy,
    error,
    enable,
    disable,
  }
}
