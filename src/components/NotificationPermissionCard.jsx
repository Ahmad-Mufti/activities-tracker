import { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

const SUPPORTED = typeof window !== 'undefined' && 'Notification' in window

export default function NotificationPermissionCard() {
  const [permission, setPermission] = useState(SUPPORTED ? Notification.permission : 'unsupported')

  if (!SUPPORTED || permission === 'granted') {
    return null
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
        <BellOff size={16} />
        Notifikasi diblokir di browser ini. Aktifkan lewat pengaturan situs kalau berubah pikiran.
      </div>
    )
  }

  async function handleEnable() {
    const result = await Notification.requestPermission()
    setPermission(result)
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">
      <div className="flex items-center gap-2 text-blue-700">
        <Bell size={16} />
        Aktifkan notifikasi supaya diingatkan jadwal & tugas yang mendekat.
      </div>
      <button
        onClick={handleEnable}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        Aktifkan
      </button>
    </div>
  )
}
