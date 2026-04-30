import { useState } from 'react'
import { LogOut, User, Tag, ChevronRight, Moon, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import Modal from '../components/ui/Modal'
import PageHeader from '../components/ui/PageHeader'

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [showEditName, setShowEditName] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleLogout() {
    try { await signOut() }
    catch { toast.error('Error al cerrar sesión') }
  }

  async function handleSaveName() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: { full_name: trimmed } })
      if (error) throw error
      toast.success('Nombre actualizado')
      setShowEditName(false)
    } catch {
      toast.error('Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const name = user?.user_metadata?.full_name ?? 'Usuario'
  const email = user?.email ?? ''

  return (
    <div>
      {/* ── Sticky header ── */}
      <PageHeader>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white py-1">Ajustes</h1>
      </PageHeader>

      <div className="px-4 py-4 space-y-4">
        {/* Perfil */}
        <div className="card p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-lg flex-shrink-0">
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
              ? <Moon className="w-5 h-5 text-violet-400" />
              : <Sun className="w-5 h-5 text-violet-500" />
            }
            <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
              {theme === 'dark' ? 'Modo oscuro' : 'Modo claro'}
            </span>
            <button
              onClick={toggleTheme}
              className={`relative w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-violet-600' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <button
            onClick={() => navigate('/ajustes/categorias')}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <Tag className="w-5 h-5 text-violet-500" />
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Gestionar categorías</span>
            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
          </button>

          <button
            onClick={() => { setNewName(name); setShowEditName(true) }}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
          >
            <User className="w-5 h-5 text-violet-500" />
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">Editar nombre</span>
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

      {showEditName && (
        <Modal title="Editar nombre" onClose={() => setShowEditName(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre</label>
              <input
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                className="input"
                placeholder="Tu nombre"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowEditName(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveName}
                disabled={saving || !newName.trim()}
                className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
