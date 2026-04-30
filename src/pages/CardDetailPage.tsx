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

  const totalExpenses = movements
    .filter(m => m.type === 'expense')
    .reduce((sum, m) => sum + Math.abs(m.amount), 0)

  const totalPayments = movements
    .filter(m => m.type === 'payment' || m.type === 'income')
    .reduce((sum, m) => sum + m.amount, 0)

  const balance = totalPayments - totalExpenses

  async function handleCreate(data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) {
    try {
      await createMovement.mutateAsync({ ...data, card_id: id! })
      toast.success('Movimiento registrado')
      setShowForm(false)
    } catch {
      toast.error('Error al guardar')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteMovement.mutateAsync(deleting)
      toast.success('Movimiento eliminado')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/tarjetas')} className="p-2 rounded-xl hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">{card.name}</h1>
          {card.bank && <p className="text-xs text-gray-500">{card.bank}</p>}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {/* Resumen */}
      <div className="rounded-2xl p-4 mb-4 text-white" style={{ backgroundColor: card.color }}>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-white/70 text-xs">Gastos</p>
            <p className="font-bold">{formatMXN(totalExpenses)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs">Pagos</p>
            <p className="font-bold">{formatMXN(totalPayments)}</p>
          </div>
          <div>
            <p className="text-white/70 text-xs">Balance</p>
            <p className={`font-bold ${balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatMXN(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm text-gray-700 bg-transparent outline-none"
          >
            {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 flex-1">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={month ?? ''}
            onChange={e => setMonth(e.target.value ? Number(e.target.value) : undefined)}
            className="text-sm text-gray-700 bg-transparent outline-none w-full"
          >
            <option value="">Todos los meses</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de movimientos */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : movements.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">Sin movimientos en este período</p>
      ) : (
        <div className="space-y-2">
          {movements.map(m => {
            const isExpense = m.type === 'expense'
            const cat = categories.find(c => c.id === m.category_id)
            return (
              <div key={m.id} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: cat?.color ?? '#94a3b8' }}
                >
                  {(cat?.name ?? 'O').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.merchant}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-xs text-gray-400">{formatShortDate(m.date)}</p>
                    {cat && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: cat.color }}
                      >
                        {cat.name}
                      </span>
                    )}
                    {m.msi_months && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        {m.msi_months}MSI
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-semibold ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                    {isExpense ? '-' : '+'}{formatMXN(Math.abs(m.amount))}
                  </p>
                </div>
                <button onClick={() => setDeleting(m.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Nuevo movimiento" onClose={() => setShowForm(false)}>
          <MovementForm
            cardId={id!}
            categories={categories}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
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
