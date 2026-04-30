import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, CreditCard, BarChart2, Wallet, Settings, RefreshCw } from 'lucide-react'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'

const navItems = [
  { to: '/',         icon: LayoutDashboard, label: 'Inicio'   },
  { to: '/tarjetas', icon: CreditCard,      label: 'Tarjetas' },
  { to: '/resumen',  icon: BarChart2,       label: 'Resumen'  },
  { to: '/cuentas',  icon: Wallet,          label: 'Cuentas'  },
  { to: '/ajustes',  icon: Settings,        label: 'Ajustes'  },
]

export default function AppLayout() {
  const { pullY, refreshing, THRESHOLD } = usePullToRefresh()

  return (
    <div className="flex min-h-dvh bg-gray-50 dark:bg-gray-950">

      {/* ── Sidebar — solo md+ ── */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 fixed left-0 top-0 h-full
                        bg-white dark:bg-gray-900
                        border-r border-gray-100 dark:border-gray-800 z-40">
        {/* Logo — spacer absorbe safe area en iPad con notch */}
        <div
          className="flex items-center gap-2.5 px-5 pb-5 border-b border-gray-100 dark:border-gray-800"
          style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 20px)' }}
        >
          <img src="/logo.png" alt="Finanzas AL" className="w-8 h-8 rounded-xl flex-shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white text-base">Finanzas AL</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400'
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
      {/*
        pb-nav en móvil: espacio para el bottom nav + home indicator.
        md:pb-0: en desktop no hay bottom nav.
        md:ml-56: compensar el sidebar fijo.
      */}
      {/* Pull-to-refresh indicator — mobile only */}
      {(pullY > 8 || refreshing) && (
        <div
          className="md:hidden fixed left-0 right-0 z-30 flex justify-center pointer-events-none"
          style={{ top: `calc(env(safe-area-inset-top, 0px) + ${Math.max(pullY - 16, 4)}px)` }}
        >
          <div
            className={`bg-white dark:bg-gray-800 rounded-full p-2 shadow-md ${refreshing ? 'animate-spin' : ''}`}
            style={{ opacity: refreshing ? 1 : Math.min(pullY / THRESHOLD, 1) }}
          >
            <RefreshCw className="w-4 h-4 text-violet-600" />
          </div>
        </div>
      )}

      <main className="flex-1 md:ml-56 lg:ml-64 min-h-dvh pb-nav md:pb-0">
        <div className="max-w-2xl mx-auto md:px-2 lg:px-4">
          <Outlet />
        </div>
      </main>

      {/* ── Bottom nav — solo móvil ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50
                   bg-white dark:bg-gray-900
                   border-t border-gray-100 dark:border-gray-800"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex h-16">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                  isActive
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-violet-50 dark:bg-violet-950/60' : ''}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
