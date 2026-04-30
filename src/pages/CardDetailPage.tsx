import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Filter, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCards } from '../hooks/useCards'
import { useMovements, useCreateMovement, useDeleteMovement } from '../hooks/useMovements'
import { useCategories } from '../hooks/useCategories'
import MovementForm from '../components/movements/MovementForm'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import { formatMXN, formatShortDate, MONTHS } from '../lib/format'
import type { Movement } from '../types/database'

const CURRENT_YEAR = new Date().getFullYear()

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cards = [] } = useCards()
  const { data: categories = [] } = useCategories()
  const card = cards.find(c => c.id === id)

  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState<number | undefined>(new Date().getMonth() + 1)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const { data: movements = [], isLoading } = useMovements({ year, month, cardId: id })
  const createMovement = useCreateMovement()
  const deleteMovement = useDeleteMovement()

  if (!card) return null

  const totalExpenses = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)
  const totalPayments = movements.filter(m => m.type === 'payment' || m.type === 'income').reduce((s, m) => s + m.amount, 0)
  const balance = totalPayments - totalExpenses

  async function handleCreate(data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) {
    try { await createMovement.mutateAsync({ ...data, card_id: id! }); toast.success('Movimiento registrado'); setShowForm(false) }
    catch { toast.error('Error al guardar') }
  }
  async function handleDelete() {
    if (!deleting) return
    try { await deleteMovement.mutateAsync(deleting); toast.success('Eliminado') }
    catch { toast.error('Error al eliminar') }
    finally { setDeleting(null) }
  }

  return (
    <div>
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        {/* Barra superior con back + título + agregar */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <button onClick={() => navigate('/tarjetas')} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-white truncate">{card.name}</h1>
            {card.bank && <p className="text-xs text-gray-500 dark:text-gray-400">{card.bank}</p>}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>

        {/* Resumen de balance */}
        <div className="mx-4 mb-3 rounded-xl p-3 text-white grid grid-cols-3 gap-2 text-center" style={{ backgroundColor: card.color }}>
          <div>
            <p className="text-white/70 text-xs">Gastos</p>
            <p className="font-bold text-sm">{formatMXN(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs">Pagos</p>
            <p className="font-bold text-sm">{formatMXN(totalPayments)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs">Balance</p>
            <p className={`font-bold text-sm ${balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>{formatMXN(balance)}</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 px-4 pb-3">
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm text-gray-700 dark:text-gray-200 bg-transparent outline-none">
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 flex-1">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={month ?? ''} onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)} className="text-sm text-gray-700 dark:text-gray-200 bg-transparent outline-none w-full">
              <option value="">Todos</option>
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Lista de movimientos ── */}
      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-16 card animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : movements.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-600 py-12 text-sm">Sin movimientos en este período</p>
        ) : (
          <div className="space-y-2">
            {movements.map(m => {
              const isExpense = m.type === 'expense'
              const cat = categories.find(c => c.id === m.category_id)
              return (
                <div key={m.id} className="card p-3 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                  >
                    {(cat?.name ?? 'O').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.merchant}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatShortDate(m.date)}</p>
                      {cat && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: cat.color }}>
                          {cat.name}
                        </span>
                      )}
                      {m.msi_months && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400">
                          {m.msi_months}MSI
                        </span>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-semibold flex-shrink-0 ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {isExpense ? '-' : '+'}{formatMXN(Math.abs(m.amount))}
                  </p>
                  <button onClick={() => setDeleting(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-400 flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && (
        <Modal title="Nuevo movimiento" onClose={() => setShowForm(false)}>
          <MovementForm cardId={id!} categories={categories} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          message="¿Eliminar este movimiento? Si tiene cuotas MSI también se eliminarán."
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
