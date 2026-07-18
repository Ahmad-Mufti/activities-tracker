import { useState } from 'react'
import { RotateCcw, BrainCog, BookOpen, Settings } from 'lucide-react'
import MurajaahTab from '../components/MurajaahTab'
import HafalanTab from '../components/HafalanTab'
import BacaTab from '../components/BacaTab'
import PengaturanTab from '../components/PengaturanTab'

const TABS = [
  { key: 'muraja', label: "Muraja'ah", icon: RotateCcw, Component: MurajaahTab },
  { key: 'hafalan', label: 'Hafalan', icon: BrainCog, Component: HafalanTab },
  { key: 'baca', label: 'Baca', icon: BookOpen, Component: BacaTab },
  { key: 'pengaturan', label: 'Pengaturan', icon: Settings, Component: PengaturanTab },
]

export default function Rohani() {
  const [activeTab, setActiveTab] = useState('muraja')
  const active = TABS.find((t) => t.key === activeTab)
  const ActiveComponent = active.Component

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800">Rohani</h1>

      <div className="mt-4 flex gap-1 overflow-x-auto rounded-lg border border-gray-300 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${
              activeTab === key ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <ActiveComponent />
      </div>
    </div>
  )
}
