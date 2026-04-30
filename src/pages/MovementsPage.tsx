import { useState } from 'react'
import { Plus, Pencil, Trash2, Wallet, Filter, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  useIncomeAccounts, useCreateIncomeAccount, useUpdateIncomeAccount, useDeleteIncomeAccount,
  useIncomeMovements, useCreateIncomeMovement, useDeleteIncomeMovement,
} from '../hooks/useIncomeAccounts'
import { useCategories } from '../hooks/useCategories'
import type { IncomeAccount, IncomeMovement } from '../types/database'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import IncomeAccountForm from '../components/income/IncomeAccountForm'
import IncomeMovementForm from '../components/income/IncomeMovementForm'
import { formatMXN, formatShortDate, MONTHS } from '../lib/format'

const CURRENT_YEAR = new Date().getFullYear()

export default function MovementsPage() {
  const { data: accounts = [] } = useIncomeAccounts()
  const { data: categories = [] } = useCategories()
  const createAccount = useCreateIncomeAccount()
  const updateAccount = useUpdateIncomeAccount()
  const deleteAccount = useDeleteIncomeAccount()

  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState<number | undefined>(new Date().getMonth() + 1)
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined)

  const { data: movements = [] } = useIncomeMovements({ year, month, accountId: selectedAccount })
  const createMovement = useCreateIncomeMovement()
  const deleteMovement = useDeleteIncomeMovement()

  const [showAccountForm, setShowAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<IncomeAccount | null>(null)
  const [deletingAccount, setDeletingAccount] = useState<IncomeAccount | null>(null)
  const [showMovementForm, setShowMovementForm] = useState(false)
  const [deletingMovement, setDeletingMovement] = useState<string | null>(null)

  const totalIncome = movements.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0)
  const totalExpense = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)

  async function handleCreateAccount(data: Omit<IncomeAccount, 'id' | 'created_at' | 'user_id'>) {
    try { await createAccount.mutateAsync(data); toast.success('Cuenta creada'); setShowAccountForm(false) }
    catch { toast.error('Error al crear cuenta') }
  }
  async function handleUpdateAccount(data: Omit<IncomeAccount, 'id' | 'created_at' | 'user_id'>) {
    if (!editingAccount) return
    try { await updateAccount.mutateAsync({ id: editingAccount.id, ...data }); toast.success('Actualizada'); setEditingAccount(null) }
    catch { toast.error('Error al actualizar') }
  }
  async function handleDeleteAccount() {
    if (!deletingAccount) return
    try { await deleteAccount.mutateAsync(deletingAccount.id); toast.success('Cuenta eliminada') }
    catch { toast.error('Error al eliminar') }
    finally { setDeletingAccount(null) }
  }
  async function handleCreateMovement(data: Omit<IncomeMovement, 'id' | 'created_at' | 'user_id'>) {
    try { await createMovement.mutateAsync(data); toast.success('Movimiento registrado'); setShowMovementForm(false) }
    catch { toast.error('Error al guardar') }
  }
  async function handleDeleteMovement() {
    if (!deletingMovement) return
    try { await deleteMovement.mutateAsync(deletingMovement); toast.success('Eliminado') }
    catch { toast.error('Error al eliminar') }
    finally { setDeletingMovement(null) }
  }

  return (
    <div>
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 pt-3 pb-2">
          {/* Título + botones */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Cuentas</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAccountForm(true)}
                className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Cuenta
              </button>
              <button
                onClick={() => setShowMovementForm(true)}
                disabled={accounts.length === 0}
                className="flex items-center gap-1 bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-medium disabled:opacity-40 active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4" />
                Movimiento
              </button>
            </div>
          </div>

          {/* Chips de cuentas */}
          {accounts.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3 pb-0.5">
              <button
                onClick={() => setSelectedAccount(undefined)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  !selectedAccount ? 'bg-violet-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Todas
              </button>
              {accounts.map(acc => (
                <div key={acc.id} className="flex-shrink-0 flex items-center gap-1">
                  <button
                    onClick={() => setSelectedAccount(acc.id === selectedAccount ? undefined : acc.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedAccount === acc.id ? 'text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                    style={selectedAccount === acc.id ? { backgroundColor: acc.color } : {}}
                  >
                    {acc.name}
                  </button>
                  <button onClick={() => setEditingAccount(acc)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeletingAccount(acc)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Filtros */}
          <div className="flex gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm bg-transparent outline-none text-gray-700 dark:text-gray-200">
                {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1">
              <Filter className="w-4 h-4 text-gray-400" />
              <select value={month ?? ''} onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)} className="text-sm bg-transparent outline-none w-full text-gray-700 dark:text-gray-200">
                <option value="">Todo el año</option>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>

          {/* Totales */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 dark:bg-green-950/40 rounded-xl p-2.5 text-center">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Ingresos</p>
              <p className="text-base font-bold text-green-700 dark:text-green-400">{formatMXN(totalIncome)}</p>
            </div>
            <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-2.5 text-center">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Egresos</p>
              <p className="text-base font-bold text-red-700 dark:text-red-400">{formatMXN(totalExpense)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lista de movimientos ── */}
      <div className="px-4 py-4">
        {accounts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Sin cuentas</p>
            <p className="text-sm mt-1">Agrega una cuenta de nómina, débito o ahorro</p>
          </div>
        ) : movements.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-600 py-8 text-sm">Sin movimientos en este período</p>
        ) : (
          <div className="space-y-2">
            {movements.map(m => {
              const isIncome = m.type === 'income'
              const cat = categories.find(c => c.id === m.category_id)
              const acc = accounts.find(a => a.id === m.account_id)
              return (
                <div key={m.id} className="card p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: acc?.color ?? '#94a3b8' }}>
                    {(acc?.name ?? 'C').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.concept}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatShortDate(m.date)}</p>
                      {acc && <span className="text-xs text-gray-400 dark:text-gray-500">· {acc.name}</span>}
                      {cat && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isIncome ? '+' : '-'}{formatMXN(Math.abs(m.amount))}
                  </p>
                  <button onClick={() => setDeletingMovement(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showAccountForm && <Modal title="Nueva cuenta" onClose={() => setShowAccountForm(false)}><IncomeAccountForm onSubmit={handleCreateAccount} onCancel={() => setShowAccountForm(false)} /></Modal>}
      {editingAccount && <Modal title="Editar cuenta" onClose={() => setEditingAccount(null)}><IncomeAccountForm initial={editingAccount} onSubmit={handleUpdateAccount} onCancel={() => setEditingAccount(null)} /></Modal>}
      {deletingAccount && <ConfirmDialog message={`¿Eliminar cuenta "${deletingAccount.name}"?`} onConfirm={handleDeleteAccount} onCancel={() => setDeletingAccount(null)} />}
      {showMovementForm && <Modal title="Nuevo movimiento" onClose={() => setShowMovementForm(false)}><IncomeMovementForm accounts={accounts} categories={categories} onSubmit={handleCreateMovement} onCancel={() => setShowMovementForm(false)} /></Modal>}
      {deletingMovement && <ConfirmDialog message="¿Eliminar este movimiento?" onConfirm={handleDeleteMovement} onCancel={() => setDeletingMovement(null)} />}
    </div>
  )
}
