import { supabase } from '../supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim()

// Apakah kunci VAPID publik tersedia di environment ini. Kalau tidak, browser
// tak bisa membuat subscription push sama sekali (mis. lupa mengisi
// VITE_VAPID_PUBLIC_KEY di Vercel). UI memakai ini untuk memberi tahu user
// alih-alih menampilkan tombol yang gagal diam-diam.
export const PUSH_CONFIGURED = Boolean(VAPID_PUBLIC_KEY)

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window
}

// Apakah device/browser ini sudah punya subscription push yang aktif.
export async function getPushSubscriptionState() {
  if (!pushSupported()) return false
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  return Boolean(subscription)
}

// Daftarkan subscription push browser ini & simpan ke Supabase supaya Edge
// Function bisa kirim notifikasi walau app tertutup. Mengembalikan { ok, error }
// supaya pemanggil bisa menampilkan alasan bila gagal (bukan gagal diam-diam).
export async function subscribeToPush() {
  if (!VAPID_PUBLIC_KEY) {
    return { ok: false, error: 'Kunci VAPID belum diatur di environment ini (VITE_VAPID_PUBLIC_KEY).' }
  }
  if (!pushSupported()) {
    return { ok: false, error: 'Browser ini tidak mendukung push notification.' }
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth_key: json.keys.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) return { ok: false, error: `Gagal menyimpan langganan: ${error.message}` }
  return { ok: true }
}

// Matikan notifikasi untuk device ini: batalkan subscription di browser lalu
// hapus barisnya dari DB supaya server tak lagi mengirim push ke sini.
export async function unsubscribeFromPush() {
  if (!pushSupported()) return { ok: true }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return { ok: true }

  const { endpoint } = subscription
  await subscription.unsubscribe()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) return { ok: false, error: `Gagal menghapus langganan: ${error.message}` }
  return { ok: true }
}
