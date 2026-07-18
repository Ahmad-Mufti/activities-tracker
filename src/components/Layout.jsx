import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Calendar, ListTodo, Repeat, Moon, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNotificationReminders } from '../hooks/useNotificationReminders'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/jadwal', label: 'Jadwal', icon: Calendar },
  { to: '/tugas', label: 'Tugas', icon: ListTodo },
  { to: '/kebiasaan', label: 'Kebiasaan', icon: Repeat },
  { to: '/rohani', label: 'Rohani', icon: Moon },
]

export default function Layout() {
  const { signOut } = useAuth()
  useNotificationReminders()

  return (
    <div className="min-h-screen bg-gray-50 md:flex">
      {/* Sidebar - laptop */}
      <aside className="hidden md:fixed md:inset-y-0 md:flex md:w-56 md:flex-col md:border-r md:border-gray-200 md:bg-white">
        <div className="px-6 py-5 text-xl font-semibold text-blue-600">KampusKu</div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={signOut}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
        >
          <LogOut size={18} />
          Keluar
        </button>
      </aside>

      {/* Top bar - HP */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <span className="text-lg font-semibold text-blue-600">KampusKu</span>
        <button onClick={signOut} aria-label="Keluar" className="text-gray-500">
          <LogOut size={20} />
        </button>
      </header>

      {/* Konten halaman */}
      <main className="flex-1 px-4 py-6 pb-24 md:ml-56 md:pb-6">
        <Outlet />
      </main>

      {/* Bar bawah - HP */}
      <nav className="fixed inset-x-0 bottom-0 flex border-t border-gray-200 bg-white md:hidden">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
