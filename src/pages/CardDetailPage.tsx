import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Filter, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCards } from '../hooks/useCards'
import { useMovements, useCreateMovement, useDeleteMovement } from '../hooks/useMovements'
import { useCategories } from '../hooks/useCategories'
import MovementForm from '../components/movements/MovementForm'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SwipeRow from '../components/ui/SwipeRow'
import { formatMXN, formatShortDate, MONTHS } from '../lib/format'
import type { Movement, MovementWithRelations } from '../types/database'

const CURRENT_YEAR = new Date().getFullYear()

function groupByDate(movements: MovementWithRelations[]) {
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const map = new Map<string, MovementWithRelations[]>()
  for (const m of movements) {
    const label = m.date === today ? 'Hoy' : m.date === yesterday ? 'Ayer' : formatShortDate(m.date)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(m)
  }
  return Array.from(map.entries())
}

export default function CardDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: cards = [] } = useCards()
  const { data: categories = [] } = useCategories()
  const card = cards.find(c => c.id === id)

  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState<number | undefined>(new Date().getMonth() + 1)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<{ rootId: string; isMsi: boolean } | null>(null)

  const { data: movements = [], isLoading } = useMovements({ year, month, cardId: id })
  const createMovement = useCreateMovement()
  const deleteMovement = useDeleteMovement()

  if (!card) return null

  const totalExpenses = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)
  const totalPayments = movements.filter(m => m.type === 'payment' || m.type === 'income').reduce((s, m) => s + m.amount, 0)
  const balance = totalPayments - totalExpenses

  async function handleCreate(data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createMovement.mutateAsync({ ...data, card_id: id! })
      toast.success('Movimiento registrado')
      setShowForm(false)
    } catch { toast.error('Error al guardar') }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteMovement.mutateAsync(deleting.rootId)
      toast.success('Eliminado')
    } catch { toast.error('Error al eliminar') }
    finally { setDeleting(null) }
  }

  function requestDelete(m: { id: string; msi_parent_id?: string | null; msi_months?: number | null }) {
    // Si es hijo MSI, el root es el padre; si es padre MSI, el root es él mismo
    const rootId = m.msi_parent_id ?? m.id
    const isMsi = !!(m.msi_parent_id || (m.msi_months && m.msi_months > 1))
    setDeleting({ rootId, isMsi })
  }

  const groups = groupByDate(movements)

  return (
    <div>
      {/* ── Sticky header ── */}
      <div className="safe-header sticky top-0 z-30 bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 px-4 pt-3 pb-2">
          <button onClick={() => navigate('/tarjetas')} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-900 dark:text-white truncate">{card.name}</h1>
            {card.bank && <p className="text-xs text-gray-500 dark:text-gray-400">{card.bank}</p>}
          </div>
        </div>

        {/* Totales siempre visibles */}
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

      {/* ── Lista de movimientos agrupados por fecha ── */}
      <div className="px-4 py-4 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            <div className="skeleton h-4 w-16" />
            {[1,2,3].map(i => <div key={i} className="skeleton h-16" />)}
          </div>
        ) : movements.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-600 py-12 text-sm">Sin movimientos en este período</p>
        ) : (
          <div className="space-y-4">
            {groups.map(([label, items]) => (
              <div key={label}>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">{label}</p>
                <div className="space-y-2">
                  {items.map(m => {
                    const isExpense = m.type === 'expense'
                    const cat = categories.find(c => c.id === m.category_id)
                    const isMsiChild = !!m.msi_parent_id
                    const isMsiParent = !!(m.msi_months && m.msi_months > 1)
                    return (
                      <SwipeRow key={m.id} onDelete={() => requestDelete(m)}>
                        <div className="card p-3 flex items-center gap-3">
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
                              {(isMsiParent || isMsiChild) && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400">
                                  MSI
                                </span>
                              )}
                            </div>
                          </div>
                          <p className={`text-sm font-semibold flex-shrink-0 ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {isExpense ? '-' : '+'}{formatMXN(Math.abs(m.amount))}
                          </p>
                        </div>
                      </SwipeRow>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FAB ── */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-24 md:bottom-8 right-4 z-40 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        style={{ boxShadow: '0 4px 20px rgba(94,23,235,0.4)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {showForm && (
        <Modal title="Nuevo movimiento" onClose={() => setShowForm(false)}>
          <MovementForm cardId={id!} categories={categories} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          message={deleting.isMsi
            ? 'Este movimiento es parte de un plan MSI. ¿Eliminar todas las cuotas?'
            : '¿Eliminar este movimiento?'}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
