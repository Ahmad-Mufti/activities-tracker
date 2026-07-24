import { Bell, BellOff } from 'lucide-react'
import { usePushSubscription } from '../hooks/usePushSubscription'

function Switch({ checked, disabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

// Saklar permanen notifikasi push untuk device ini (di Pengaturan). Bisa
// dinyalakan/dimatikan kapan saja — beda dari nudge sekali-muncul di Dashboard.
export default function NotificationToggle() {
  const { supported, configured, permission, subscribed, loading, busy, error, enable, disable } =
    usePushSubscription()

  if (!supported) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="flex items-center gap-2 text-sm text-gray-500">
          <BellOff size={16} /> Browser ini tidak mendukung notifikasi.
        </p>
      </div>
    )
  }

  const blocked = permission === 'denied'

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Bell size={16} /> Notifikasi Pengingat
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Pengingat jadwal, tugas, & muraja'ah — tetap masuk walau app tertutup. Berlaku untuk device ini.
          </p>
        </div>
        <Switch
          checked={subscribed}
          disabled={loading || busy || blocked || !configured}
          onChange={subscribed ? disable : enable}
        />
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Status device ini:{' '}
        <span className="font-medium text-gray-600">
          {loading ? '…' : busy ? 'Memproses…' : subscribed ? 'Aktif' : 'Mati'}
        </span>
      </p>

      {blocked && (
        <p className="mt-2 text-xs text-amber-600">
          Notifikasi diblokir di setelan browser untuk device ini. Aktifkan lewat setelan situs (ikon gembok di address
          bar) kalau berubah pikiran.
        </p>
      )}
      {!configured && (
        <p className="mt-2 text-xs text-amber-600">
          Kunci VAPID belum diatur di environment ini, jadi notifikasi tak bisa diaktifkan di sini.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
