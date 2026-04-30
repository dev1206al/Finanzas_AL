import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, CreditCard, BarChart2, Wallet, Settings } from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Inicio'    },
  { to: '/tarjetas',  icon: CreditCard,      label: 'Tarjetas'  },
  { to: '/resumen',   icon: BarChart2,       label: 'Resumen'   },
  { to: '/ingresos',  icon: Wallet,          label: 'Ingresos'  },
  { to: '/ajustes',   icon: Settings,        label: 'Ajustes'   },
]

export default function AppLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 max-w-md mx-auto relative">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 safe-area-pb z-50">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-400'
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
