import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCards } from '../hooks/useCards'
import { useMovements, useCreateMovement, useUpdateMovement, useDeleteMovement } from '../hooks/useMovements'
import { useCategories } from '../hooks/useCategories'
import MovementForm from '../components/movements/MovementForm'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import SwipeRow from '../components/ui/SwipeRow'
import PageHeader from '../components/ui/PageHeader'
import { formatMXN, formatShortDate, getPeriods } from '../lib/format'
import type { Movement, MovementWithRelations } from '../types/database'

type TypeFilter = 'all' | 'expense' | 'payment' | 'msi'

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

  const [periodIdx, setPeriodIdx] = useState(0)
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [catFilter, setCatFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingMovement, setEditingMovement] = useState<MovementWithRelations | null>(null)
  const [deleting, setDeleting] = useState<{ rootId: string; isMsi: boolean } | null>(null)

  const periods = useMemo(() => card ? getPeriods(card.cut_day) : [], [card?.cut_day])
  // periodIdx === -1 → "Todo el historial"
  const period = periodIdx >= 0 ? periods[periodIdx] : undefined

  // Movimientos del período seleccionado (para la lista y Gastos/Pagos del período)
  const { data: movements = [], isLoading } = useMovements({
    cardId: id,
    dateFrom: period?.start,
    dateTo: period?.end,
  })

  // Todos los movimientos de la tarjeta (para Balance y Disponible reales)
  const { data: allMovements = [] } = useMovements({ cardId: id })

  const createMovement = useCreateMovement()
  const updateMovement = useUpdateMovement()
  const deleteMovement = useDeleteMovement()

  if (!card) return null

  // Gastos/Pagos del período seleccionado
  const totalExpenses = movements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)
  const totalPayments = movements.filter(m => m.type === 'payment' || m.type === 'income').reduce((s, m) => s + m.amount, 0)

  // Balance y Disponible siempre basados en el historial completo de la tarjeta
  const allExpenses = allMovements.filter(m => m.type === 'expense').reduce((s, m) => s + Math.abs(m.amount), 0)
  const allPayments = allMovements.filter(m => m.type === 'payment' || m.type === 'income').reduce((s, m) => s + m.amount, 0)
  const balance = allPayments - allExpenses

  // Categorías presentes en el período
  const periodCategories = useMemo(() => {
    const ids = new Set(movements.map(m => m.category_id).filter(Boolean))
    return categories.filter(c => ids.has(c.id))
  }, [movements, categories])

  // Lista filtrada por tipo y categoría
  const filtered = useMemo(() => movements.filter(m => {
    if (typeFilter === 'expense' && m.type !== 'expense') return false
    if (typeFilter === 'payment' && m.type !== 'payment' && m.type !== 'income') return false
    if (typeFilter === 'msi' && !m.msi_parent_id && !(m.msi_months && m.msi_months > 1)) return false
    if (catFilter && m.category_id !== catFilter) return false
    return true
  }), [movements, typeFilter, catFilter])

  async function handleCreate(data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createMovement.mutateAsync({ ...data, card_id: id! })
      toast.success('Movimiento registrado')
      setShowForm(false)
    } catch { toast.error('Error al guardar') }
  }

  async function handleUpdate(data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) {
    if (!editingMovement) return
    try {
      await updateMovement.mutateAsync({ id: editingMovement.id, ...data })
      toast.success('Movimiento actualizado')
      setEditingMovement(null)
    } catch { toast.error('Error al actualizar') }
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
    const rootId = m.msi_parent_id ?? m.id
    const isMsi = !!(m.msi_parent_id || (m.msi_months && m.msi_months > 1))
    setDeleting({ rootId, isMsi })
  }

  const groups = groupByDate(filtered)

  return (
    <div>
      <PageHeader>
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
        <div className="mx-4 mb-3 rounded-xl p-3 text-white grid grid-cols-2 gap-x-4 gap-y-3 text-center" style={{ backgroundColor: card.color }}>
          <div>
            <p className="text-white/70 text-xs">Gastos período</p>
            <p className="font-bold text-sm">{formatMXN(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs">Pagos período</p>
            <p className="font-bold text-sm">{formatMXN(totalPayments)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs mb-1">Balance total</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${balance >= 0 ? 'bg-black/25' : 'bg-black/35'}`}>
              {balance >= 0 ? '+' : ''}{formatMXN(balance)}
            </span>
          </div>
          {card.credit_limit > 0 && (
            <div>
              <p className="text-white/70 text-xs mb-1">Disponible</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white bg-black/25`}>
                {formatMXN(Math.max(card.credit_limit - (allExpenses - allPayments), 0))}
              </span>
            </div>
          )}
        </div>

        {/* Selector de período de corte */}
        <div className="px-4 pb-2">
          <select
            value={periodIdx}
            onChange={e => { setPeriodIdx(Number(e.target.value)); setTypeFilter('all'); setCatFilter('') }}
            className="w-full text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 outline-none"
          >
            <option value={-1}>Todo el historial</option>
            {periods.map((p, i) => (
              <option key={p.start} value={i}>{i === 0 ? `Período actual · ${p.label}` : p.label}</option>
            ))}
          </select>
        </div>

        {/* Filtros de tipo */}
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto no-scrollbar">
          {([
            { key: 'all', label: 'Todos' },
            { key: 'expense', label: 'Gastos' },
            { key: 'payment', label: 'Pagos' },
            { key: 'msi', label: 'MSI' },
          ] as { key: TypeFilter; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTypeFilter(key); setCatFilter('') }}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                typeFilter === key
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filtro por categoría (solo si hay categorías en el período) */}
        {periodCategories.length > 0 && (
          <div className="px-4 pb-3">
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="w-full text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-700 dark:text-gray-200 outline-none"
            >
              <option value="">Todas las categorías</option>
              {periodCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </PageHeader>

      {/* ── Lista de movimientos agrupados por fecha ── */}
      <div className="px-4 py-4 pb-16">
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
                        <div
                          className="card p-3 flex items-center gap-3 cursor-pointer active:bg-gray-50 dark:active:bg-gray-800 transition-colors"
                          onClick={() => setEditingMovement(m)}
                        >
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
        className="fixed fab-position right-4 z-40 w-14 h-14 rounded-full bg-violet-600 text-white shadow-lg flex items-center justify-center active:scale-90 transition-transform"
        style={{ boxShadow: '0 4px 20px rgba(94,23,235,0.4)' }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {showForm && (
        <Modal title="Nuevo movimiento" onClose={() => setShowForm(false)}>
          <MovementForm cardId={id!} categories={categories} onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}
      {editingMovement && (
        <Modal title="Editar movimiento" onClose={() => setEditingMovement(null)}>
          <MovementForm
            cardId={editingMovement.card_id}
            categories={categories}
            initial={editingMovement}
            onSubmit={handleUpdate}
            onCancel={() => setEditingMovement(null)}
          />
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
