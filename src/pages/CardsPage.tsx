import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, CreditCard, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCards, useCreateCard, useUpdateCard, useDeleteCard, getNextDate, getDaysUntil } from '../hooks/useCards'
import type { Card } from '../types/database'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CardForm, { type CardFormData } from '../components/cards/CardForm'
import { formatMXN } from '../lib/format'

export default function CardsPage() {
  const navigate = useNavigate()
  const { data: cards = [], isLoading } = useCards()
  const createCard = useCreateCard()
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Card | null>(null)
  const [deleting, setDeleting] = useState<Card | null>(null)

  async function handleCreate(data: CardFormData) {
    try {
      await createCard.mutateAsync({
        name: data.name,
        bank: data.bank || null,
        color: data.color,
        credit_limit: data.credit_limit,
        cut_day: data.cut_day,
        payment_day: data.payment_day,
        last_four: data.last_four || null,
        is_active: true,
      })
      toast.success('Tarjeta agregada')
      setShowForm(false)
    } catch {
      toast.error('Error al agregar tarjeta')
    }
  }

  async function handleUpdate(data: CardFormData) {
    if (!editing) return
    try {
      await updateCard.mutateAsync({
        id: editing.id,
        name: data.name,
        bank: data.bank || null,
        color: data.color,
        credit_limit: data.credit_limit,
        cut_day: data.cut_day,
        payment_day: data.payment_day,
        last_four: data.last_four || null,
      })
      toast.success('Tarjeta actualizada')
      setEditing(null)
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function handleDelete() {
    if (!deleting) return
    try {
      await deleteCard.mutateAsync(deleting.id)
      toast.success('Tarjeta eliminada')
    } catch {
      toast.error('Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">Tarjetas</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Sin tarjetas</p>
          <p className="text-sm mt-1">Agrega tu primera tarjeta de crédito</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map(card => {
            const paymentDate = getNextDate(card.payment_day)
            const cutDate = getNextDate(card.cut_day)
            const daysToPayment = getDaysUntil(paymentDate)
            const urgent = daysToPayment <= 3

            return (
              <div
                key={card.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Header de tarjeta */}
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: card.color }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-lg">{card.name}</p>
                      {card.bank && <p className="text-white/70 text-xs">{card.bank}</p>}
                      {card.last_four && <p className="text-white/70 text-xs mt-1">•••• {card.last_four}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditing(card) }}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleting(card) }}
                        className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-white/80 text-sm mt-2">Límite: {formatMXN(card.credit_limit)}</p>
                </div>

                {/* Fechas */}
                <div
                  className="px-4 py-3 flex gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/tarjetas/${card.id}`)}
                >
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Próximo corte</p>
                    <p className="text-sm font-medium text-gray-900">día {card.cut_day}</p>
                    <p className="text-xs text-gray-400">{getDaysUntil(cutDate)} días</p>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div className="flex-1">
                    <p className="text-xs text-gray-500">Próximo pago</p>
                    <p className={`text-sm font-medium ${urgent ? 'text-red-600' : 'text-gray-900'}`}>
                      día {card.payment_day}
                    </p>
                    <div className="flex items-center gap-1">
                      {urgent && <AlertCircle className="w-3 h-3 text-red-500" />}
                      <p className={`text-xs ${urgent ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                        {daysToPayment === 0 ? '¡Hoy!' : `${daysToPayment} días`}
                      </p>
                    </div>
                  </div>
                  <div className="w-px bg-gray-100" />
                  <div className="flex items-center">
                    <span className="text-xs text-indigo-600 font-medium">Ver →</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Nueva tarjeta" onClose={() => setShowForm(false)}>
          <CardForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Editar tarjeta" onClose={() => setEditing(null)}>
          <CardForm
            initial={{
              name: editing.name,
              bank: editing.bank ?? '',
              color: editing.color,
              credit_limit: editing.credit_limit,
              cut_day: editing.cut_day,
              payment_day: editing.payment_day,
              last_four: editing.last_four ?? '',
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          message={`¿Eliminar "${deleting.name}"? Se eliminarán todos sus movimientos.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
