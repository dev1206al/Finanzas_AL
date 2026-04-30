import { useState } from 'react'
import { LogOut, User, Tag, ChevronRight, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function handleLogout() {
    try { await signOut() }
    catch { toast.error('Error al cerrar sesión') }
  }

  const name = user?.user_metadata?.full_name ?? 'Usuario'
  const email = user?.email ?? ''

  return (
    <div>
      {/* ── Sticky header ── */}
      <div className="page-header">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ajustes</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Perfil */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg flex-shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate">{name}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{email}</p>
          </div>
        </div>

        {/* Opciones */}
        <div className="card overflow-hidden divide-y divide-gray-50 dark:divide-gray-800">
          {/* Dark mode toggle */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            {theme === 'dark'
              ? <Moon className="w-5 h-5 text-indigo-400" />
              : <Sun className="w-5 h-5 text-indigo-500" />
            }
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
              {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
            </span>
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => navigate('/ajustes/categorias')}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <Tag className="w-5 h-5 text-indigo-500" />
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Gestionar categorías</span>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </button>

          <button
            onClick={() => navigate('/perfil')}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <User className="w-5 h-5 text-indigo-500" />
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Editar perfil</span>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </button>
        </div>

        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full card flex items-center gap-3 px-4 py-3.5 active:bg-red-50 dark:active:bg-red-950/20 transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-500" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">Cerrar sesión</span>
        </button>
      </div>

      {confirmLogout && (
        <ConfirmDialog
          message="¿Cerrar sesión?"
          confirmLabel="Cerrar sesión"
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}
    </div>
  )
}
