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

export default function IncomePage() {
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
    try {
      await createAccount.mutateAsync(data)
      toast.success('Cuenta creada')
      setShowAccountForm(false)
    } catch {
      toast.error('Error al crear cuenta')
    }
  }

  async function handleUpdateAccount(data: Omit<IncomeAccount, 'id' | 'created_at' | 'user_id'>) {
    if (!editingAccount) return
    try {
      await updateAccount.mutateAsync({ id: editingAccount.id, ...data })
      toast.success('Cuenta actualizada')
      setEditingAccount(null)
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function handleDeleteAccount() {
    if (!deletingAccount) return
    try {
      await deleteAccount.mutateAsync(deletingAccount.id)
      toast.success('Cuenta eliminada')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeletingAccount(null)
    }
  }

  async function handleCreateMovement(data: Omit<IncomeMovement, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createMovement.mutateAsync(data)
      toast.success('Movimiento registrado')
      setShowMovementForm(false)
    } catch {
      toast.error('Error al guardar')
    }
  }

  async function handleDeleteMovement() {
    if (!deletingMovement) return
    try {
      await deleteMovement.mutateAsync(deletingMovement)
      toast.success('Movimiento eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeletingMovement(null)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Ingresos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAccountForm(true)}
            className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Cuenta
          </button>
          <button
            onClick={() => setShowMovementForm(true)}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
            disabled={accounts.length === 0}
          >
            <Plus className="w-4 h-4" />
            Movimiento
          </button>
        </div>
      </div>

      {/* Cuentas */}
      {accounts.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button
            onClick={() => setSelectedAccount(undefined)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              !selectedAccount ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Todas
          </button>
          {accounts.map(acc => (
            <div key={acc.id} className="flex-shrink-0 flex items-center gap-1">
              <button
                onClick={() => setSelectedAccount(acc.id === selectedAccount ? undefined : acc.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedAccount === acc.id ? 'text-white' : 'bg-gray-100 text-gray-600'
                }`}
                style={selectedAccount === acc.id ? { backgroundColor: acc.color } : {}}
              >
                {acc.name}
              </button>
              <button onClick={() => setEditingAccount(acc)} className="p-1 text-gray-400 hover:text-gray-600">
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
      <div className="flex gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm bg-transparent outline-none">
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={month ?? ''} onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)} className="text-sm bg-transparent outline-none w-full">
            <option value="">Todo el año</option>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <p className="text-xs text-green-600 font-medium">Ingresos</p>
          <p className="text-base font-bold text-green-700">{formatMXN(totalIncome)}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 text-center">
          <p className="text-xs text-red-600 font-medium">Egresos</p>
          <p className="text-base font-bold text-red-700">{formatMXN(totalExpense)}</p>
        </div>
      </div>

      {/* Sin cuentas */}
      {accounts.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin cuentas</p>
          <p className="text-sm mt-1">Agrega una cuenta de nómina, débito o ahorro</p>
        </div>
      ) : movements.length === 0 ? (
        <p className="text-center text-gray-400 py-8 text-sm">Sin movimientos en este período</p>
      ) : (
        <div className="space-y-2">
          {movements.map(m => {
            const isIncome = m.type === 'income'
            const cat = categories.find(c => c.id === m.category_id)
            const acc = accounts.find(a => a.id === m.account_id)
            return (
              <div key={m.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: acc?.color ?? '#94a3b8' }}
                >
                  {(acc?.name ?? 'C').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.concept}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-gray-400">{formatShortDate(m.date)}</p>
                    {acc && <span className="text-xs text-gray-400">· {acc.name}</span>}
                    {cat && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color }}>
                        {cat.name}
                      </span>
                    )}
                  </div>
                </div>
                <p className={`text-sm font-semibold flex-shrink-0 ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                  {isIncome ? '+' : '-'}{formatMXN(Math.abs(m.amount))}
                </p>
                <button onClick={() => setDeletingMovement(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showAccountForm && (
        <Modal title="Nueva cuenta" onClose={() => setShowAccountForm(false)}>
          <IncomeAccountForm onSubmit={handleCreateAccount} onCancel={() => setShowAccountForm(false)} />
        </Modal>
      )}

      {editingAccount && (
        <Modal title="Editar cuenta" onClose={() => setEditingAccount(null)}>
          <IncomeAccountForm initial={editingAccount} onSubmit={handleUpdateAccount} onCancel={() => setEditingAccount(null)} />
        </Modal>
      )}

      {deletingAccount && (
        <ConfirmDialog
          message={`¿Eliminar cuenta "${deletingAccount.name}"?`}
          onConfirm={handleDeleteAccount}
          onCancel={() => setDeletingAccount(null)}
        />
      )}

      {showMovementForm && (
        <Modal title="Nuevo movimiento" onClose={() => setShowMovementForm(false)}>
          <IncomeMovementForm
            accounts={accounts}
            categories={categories}
            onSubmit={handleCreateMovement}
            onCancel={() => setShowMovementForm(false)}
          />
        </Modal>
      )}

      {deletingMovement && (
        <ConfirmDialog
          message="¿Eliminar este movimiento?"
          onConfirm={handleDeleteMovement}
          onCancel={() => setDeletingMovement(null)}
        />
      )}
    </div>
  )
}
