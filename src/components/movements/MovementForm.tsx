import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Card, Category, Movement } from '../../types/database'

const schema = z.object({
  type: z.enum(['expense', 'payment', 'income']),
  date: z.string().min(1, 'Requerido'),
  merchant: z.string().min(1, 'Requerido'),
  amount: z.number({ error: 'Requerido' }).positive('Debe ser mayor a 0'),
  category_id: z.string().optional(),
  msi_months: z.number().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface MovementFormProps {
  cardId: string
  categories: Category[]
  cards?: Card[]
  initial?: Pick<Movement, 'type' | 'date' | 'merchant' | 'amount' | 'category_id' | 'msi_months' | 'msi_parent_id' | 'notes'>
  onSubmit: (data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

const MSI_OPTIONS = [0, 3, 6, 9, 12, 18, 24]

export default function MovementForm({ cardId, categories, cards, initial, onSubmit, onCancel }: MovementFormProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedCardId, setSelectedCardId] = useState(cardId)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      type: initial.type,
      date: initial.date,
      merchant: initial.merchant,
      amount: Math.abs(initial.amount),
      category_id: initial.category_id ?? '',
      msi_months: initial.msi_months ?? 0,
      notes: initial.notes ?? '',
    } : {
      type: 'expense',
      date: today,
      merchant: '',
      amount: undefined,
      category_id: '',
      msi_months: 0,
      notes: '',
    },
  })

  const type = watch('type')

  async function handleSubmitForm(data: FormData) {
    const signedAmount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)

    await onSubmit({
      card_id: selectedCardId,
      type: data.type,
      date: data.date,
      merchant: data.merchant,
      amount: signedAmount,
      category_id: data.category_id || null,
      msi_months: data.type === 'expense' && data.msi_months && data.msi_months > 1 ? data.msi_months : null,
      msi_parent_id: null,
      notes: data.notes || null,
    })
  }

  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'lent')
  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'expense')

  const visibleCategories = type === 'expense' ? expenseCategories : incomeCategories

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      {/* Selector de tarjeta (solo cuando se pasan múltiples) */}
      {cards && cards.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarjeta *</label>
          <select
            value={selectedCardId}
            onChange={e => setSelectedCardId(e.target.value)}
            className="input"
          >
            {cards.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Tipo */}
      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
        {(['expense', 'payment', 'income'] as const).map(t => (
          <label
            key={t}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              type === t ? 'bg-white dark:bg-gray-700 shadow text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <input {...register('type')} type="radio" value={t} className="sr-only" />
            {t === 'expense' ? 'Gasto' : t === 'payment' ? 'Pago tarjeta' : 'Ingreso'}
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {type === 'expense' ? 'Establecimiento' : 'Concepto'} *
        </label>
        <input {...register('merchant')} placeholder="Nombre del lugar o concepto" className="input" />
        {errors.merchant && <p className="text-red-500 text-xs mt-1">{errors.merchant.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha *</label>
        <input {...register('date')} type="date" className="input" />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto *</label>
        <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className="input" />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
        <select {...register('category_id')} className="input">
          <option value="">Sin categoría</option>
          {visibleCategories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {type === 'expense' && !initial?.msi_parent_id && !(initial?.msi_months && initial.msi_months > 1) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Meses sin intereses</label>
          <select {...register('msi_months', { valueAsNumber: true })} className="input">
            {MSI_OPTIONS.map(m => (
              <option key={m} value={m}>{m === 0 || m === 1 ? 'Sin MSI' : `${m} meses`}</option>
            ))}
          </select>
        </div>
      )}
      {initial && (initial.msi_parent_id || (initial.msi_months && initial.msi_months > 1)) && (
        <p className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
          Este movimiento forma parte de un plan MSI. Solo se editará esta cuota.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
        <input {...register('notes')} placeholder="Opcional" className="input" />
      </div>

      <div
        className={`rounded-xl p-3 text-sm text-center font-medium ${
          type === 'expense' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400' : 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400'
        }`}
      >
        {type === 'expense' ? 'Este movimiento restará del balance' : 'Este movimiento sumará al balance'}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
