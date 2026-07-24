import { useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { DAYS } from '../lib/days'
import { computePrayerTimes, computeSlotBoundaries, formatTime, formatDuration, PRAYER_LABELS, PRAYER_ORDER } from '../lib/prayerTimes'
import NotificationToggle from './NotificationToggle'

function decimalHoursToParts(hours) {
  const total = Math.round(Number(hours ?? 0) * 60)
  return { h: Math.floor(total / 60), m: total % 60 }
}

function partsToDecimalHours(h, m) {
  const hh = Number(h)
  const mm = Number(m)
  return (Number.isNaN(hh) ? 0 : hh) + (Number.isNaN(mm) ? 0 : mm) / 60
}

const CALC_METHODS = [
  { value: 'KEMENAG', label: 'KEMENAG (Indonesia) — perkiraan' },
  { value: 'MuslimWorldLeague', label: 'Muslim World League' },
  { value: 'Singapore', label: 'Singapore' },
  { value: 'UmmAlQura', label: 'Umm Al-Qura (Mekah)' },
  { value: 'Egyptian', label: 'Egyptian' },
  { value: 'Karachi', label: 'Karachi' },
]

export default function PengaturanTab() {
  const [cap, setCap] = useState(15)
  const [dayOff, setDayOff] = useState(7)
  const [sleepH, setSleepH] = useState(7)
  const [sleepM, setSleepM] = useState(0)
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [calcMethod, setCalcMethod] = useState('KEMENAG')
  const [loading, setLoading] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState('')

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(timer)
  }, [saved])

  useEffect(() => {
    supabase
      .from('user_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCap(data.muraja_daily_cap ?? 15)
          setDayOff(data.day_off_of_week ?? 7)
          const { h, m } = decimalHoursToParts(data.sleep_hours ?? 7)
          setSleepH(h)
          setSleepM(m)
          setLatitude(data.latitude ?? '')
          setLongitude(data.longitude ?? '')
          setCalcMethod(data.calc_method ?? 'KEMENAG')
        }
        setLoading(false)
      })
  }, [])

  async function saveSettings() {
    setError('')
    setSaved(false)
    setBusy(true)

    const { error } = await supabase.from('user_settings').upsert(
      {
        muraja_daily_cap: Number(cap),
        day_off_of_week: Number(dayOff),
        sleep_hours: partsToDecimalHours(sleepH, sleepM),
        latitude: latitude === '' ? null : Number(latitude),
        longitude: longitude === '' ? null : Number(longitude),
        calc_method: calcMethod,
      },
      { onConflict: 'user_id' },
    )

    setBusy(false)
    if (error) {
      setError(error.message)
      return false
    }
    setSaved(true)
    return true
  }

  // Hanya menyimpan latitude/longitude — tidak menyentuh field lain yang mungkin
  // sedang diedit tapi belum di-submit lewat tombol "Simpan Pengaturan".
  async function saveLocationOnly(lat, lng) {
    const { error } = await supabase
      .from('user_settings')
      .upsert({ latitude: lat, longitude: lng }, { onConflict: 'user_id' })
    if (error) {
      setLocError(`Lokasi didapat tapi gagal disimpan: ${error.message}`)
      return false
    }
    return true
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocError('Perangkat/browser ini tidak mendukung deteksi lokasi.')
      return
    }
    setLocating(true)
    setLocError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setLatitude(lat)
        setLongitude(lng)
        setLocating(false)
        await saveLocationOnly(Number(lat), Number(lng))
      },
      () => {
        setLocError('Gagal mengambil lokasi. Izinkan akses lokasi, atau isi manual.')
        setLocating(false)
      },
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await saveSettings()
  }

  const preview = useMemo(() => {
    if (latitude === '' || longitude === '') return null
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null
    return {
      times: computePrayerTimes({ latitude: lat, longitude: lng, calcMethod }),
      slots: computeSlotBoundaries({
        latitude: lat,
        longitude: lng,
        calcMethod,
        sleepHours: partsToDecimalHours(sleepH, sleepM),
      }),
    }
  }, [latitude, longitude, calcMethod, sleepH, sleepM])

  if (loading) {
    return <p className="text-gray-400">Memuat...</p>
  }

  return (
    <div className="max-w-sm space-y-8">
      <NotificationToggle />

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="block text-sm font-medium text-gray-700">Lama Tidur (per malam)</label>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="number"
              inputMode="numeric"
              required
              min="0"
              max="23"
              value={sleepH}
              onChange={(e) => setSleepH(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-500">jam</span>
            <input
              type="number"
              inputMode="numeric"
              required
              min="0"
              max="59"
              value={sleepM}
              onChange={(e) => setSleepM(e.target.value)}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <span className="text-sm text-gray-500">menit</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Lama tidur (durasi), bukan jam berapa kamu tidur. Contoh: 7 jam 30 menit. Dipakai menghitung waktu luang &
            batas slot "malam" (Isya → jam tidur).
          </p>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium text-gray-700">Lokasi (untuk jadwal sholat)</label>
          <div className="mt-1 grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              placeholder="Lintang (latitude)"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="any"
              placeholder="Bujur (longitude)"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <MapPin size={14} /> {locating ? 'Mengambil lokasi...' : 'Gunakan Lokasi Saya'}
          </button>
          {locError && <p className="mt-1 text-xs text-red-600">{locError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Metode Perhitungan</label>
          <select
            value={calcMethod}
            onChange={(e) => setCalcMethod(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {CALC_METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </form>

      {preview && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500">Pratinjau Jadwal Sholat Hari Ini</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            {PRAYER_ORDER.map((key) => (
              <div key={key}>
                <p className="text-[11px] text-gray-400">{PRAYER_LABELS[key]}</p>
                <p className="text-sm font-medium text-gray-800">{formatTime(preview.times?.[key])}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs font-semibold text-gray-500">Pratinjau Batas Slot</p>
          <div className="mt-2 space-y-1">
            {preview.slots.map((s) => (
              <p key={s.key} className="flex justify-between text-xs text-gray-600">
                <span>{s.label}</span>
                <span>
                  {formatTime(s.start)}–{formatTime(s.end)}{' '}
                  <span className="text-gray-400">({formatDuration(s.start, s.end)})</span>
                </span>
              </p>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            Batas slot dipakai penuh untuk pengecekan anggaran waktu di Fase 11. Untuk sekarang hanya ditampilkan.
          </p>
        </div>
      )}

      {saved && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg md:bottom-4">
          Pengaturan tersimpan.
        </div>
      )}
    </div>
  )
}
