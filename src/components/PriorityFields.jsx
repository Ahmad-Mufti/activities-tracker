import { SLOT_OPTIONS } from '../lib/prayerTimes'

const DURATION_CHIPS = [15, 30, 60, 120]

export function PriorityTierSelect({ value, onChange, label = 'Prioritas' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="wajib">Wajib</option>
        <option value="rutin">Rutin</option>
        <option value="bonus">Bonus</option>
      </select>
    </div>
  )
}

export function DurationMinutesField({ value, onChange, label = 'Estimasi Durasi (menit, opsional)' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="mis. 30"
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <div className="mt-1.5 flex gap-1.5">
        {DURATION_CHIPS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onChange(String(m))}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
              String(value) === String(m)
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {m}m
          </button>
        ))}
      </div>
    </div>
  )
}

export function TimeSlotSelect({ value, onChange, label = 'Slot Waktu (opsional)' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Tidak ditentukan</option>
        {SLOT_OPTIONS.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
