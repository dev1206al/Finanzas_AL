import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, CreditCard, BarChart2, Wallet, Settings, TrendingUp } from 'lucide-react'

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Inicio'   },
  { to: '/tarjetas', icon: CreditCard,      label: 'Tarjetas' },
  { to: '/resumen',  icon: BarChart2,       label: 'Resumen'  },
  { to: '/movimientos', icon: Wallet,        label: 'Movimientos' },
  { to: '/ajustes',  icon: Settings,        label: 'Ajustes'  },
]

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* ── Sidebar — iPad y desktop (md+) ── */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 fixed left-0 top-0 h-full
                        bg-white dark:bg-gray-900
                        border-r border-gray-100 dark:border-gray-800 z-40">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4.5 h-4.5 text-white w-5 h-5" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-base">Finanzas AL</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-600 text-center">Finanzas AL v1.0</p>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="flex-1 md:ml-56 lg:ml-64 overflow-y-auto scroll-container
                       pb-20 md:pb-0 min-h-screen">
        {/* Envuelve en max-width para desktop */}
        <div className="max-w-2xl mx-auto md:px-2 lg:px-4">
          <Outlet />
        </div>
      </main>

      {/* ── Bottom nav — solo móvil ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                      bg-white dark:bg-gray-900
                      border-t border-gray-100 dark:border-gray-800
                      safe-area-pb">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 pt-2.5 pb-1.5 text-xs transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
