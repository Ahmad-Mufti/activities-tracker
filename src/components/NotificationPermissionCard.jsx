import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePushSubscription } from '../hooks/usePushSubscription'

// Nudge ringan di Dashboard: hanya muncul saat notifikasi BELUM aktif di device
// ini. Untuk menyalakan/mematikan kapan saja, ada saklar permanen di Pengaturan.
export default function NotificationPermissionCard() {
  const { supported, configured, permission, subscribed, loading, busy, enable } = usePushSubscription()

  // Sembunyikan kalau: tak didukung, masih memuat status, sudah aktif, diblokir,
  // atau kunci VAPID belum diatur (biar tak menyuruh menekan tombol yang gagal).
  if (!supported || loading || subscribed || permission === 'denied' || !configured) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
      <div className="flex items-center gap-2 text-blue-700">
        <Bell size={16} />
        Aktifkan notifikasi supaya diingatkan jadwal & tugas yang mendekat.
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={enable}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Mengaktifkan…' : 'Aktifkan'}
        </button>
        <Link to="/rohani" className="text-xs font-medium text-blue-600 hover:underline">
          Atur di Pengaturan
        </Link>
      </div>
    </div>
  )
}
