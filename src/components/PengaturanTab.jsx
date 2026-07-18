import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { DAYS } from '../lib/days'

export default function PengaturanTab() {
  const [cap, setCap] = useState(15)
  const [dayOff, setDayOff] = useState(7)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase
      .from('user_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCap(data.muraja_daily_cap)
          setDayOff(data.day_off_of_week)
        }
        setLoading(false)
      })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)

    const { error } = await supabase
      .from('user_settings')
      .upsert({ muraja_daily_cap: Number(cap), day_off_of_week: Number(dayOff) }, { onConflict: 'user_id' })

    setBusy(false)
    if (error) {
      setError(error.message)
      return
    }
    setSaved(true)
  }

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Batas Muraja'ah per Hari</label>
        <input
          type="number"
          required
          min="1"
          value={cap}
          onChange={(e) => setCap(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-gray-400">
          Maksimal berapa unit hafalan yang ditampilkan untuk diulang per hari. Sisanya tidak hilang, otomatis
          muncul lagi besok.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Hari Libur Setoran Hafalan Baru</label>
        <select
          value={dayOff}
          onChange={(e) => setDayOff(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {DAYS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          Hari ini tidak akan ada setoran hafalan baru yang dijadwalkan — muraja'ah tetap jalan seperti biasa.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-600">Pengaturan tersimpan.</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {busy ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </form>
  )
}
