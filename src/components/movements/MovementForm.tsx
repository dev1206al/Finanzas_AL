import { useState, useMemo } from 'react'
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

interface HistoryEntry {
  merchant: string
  category_id: string | null
  date: string
}

interface MovementFormProps {
  cardId: string
  categories: Category[]
  cards?: Card[]
  history?: HistoryEntry[]
  initial?: Pick<Movement, 'type' | 'date' | 'merchant' | 'amount' | 'category_id' | 'msi_months' | 'msi_parent_id' | 'notes'>
  onSubmit: (data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

const MSI_OPTIONS = [0, ...Array.from({ length: 23 }, (_, i) => i + 2)]

export default function MovementForm({ cardId, categories, cards, history, initial, onSubmit, onCancel }: MovementFormProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [selectedCardId, setSelectedCardId] = useState(cardId)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
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
  const merchant = watch('merchant')
  const categoryId = watch('category_id')

  // Busca la categoría más frecuente para el establecimiento escrito
  const suggestion = useMemo(() => {
    if (!history || initial || suggestionDismissed) return null
    const query = merchant?.trim().toLowerCase() ?? ''
    if (query.length < 3) return null

    const counts = new Map<string, { count: number; lastDate: string }>()
    for (const entry of history) {
      if (!entry.category_id) continue
      const norm = entry.merchant.toLowerCase()
      if (!norm.includes(query) && !query.includes(norm)) continue
      const prev = counts.get(entry.category_id)
      if (!prev || entry.date > prev.lastDate) {
        counts.set(entry.category_id, {
          count: (prev?.count ?? 0) + 1,
          lastDate: entry.date,
        })
      } else {
        counts.set(entry.category_id, { count: prev.count + 1, lastDate: prev.lastDate })
      }
    }

    if (counts.size === 0) return null

    const [bestId] = [...counts.entries()].sort((a, b) =>
      b[1].count - a[1].count || b[1].lastDate.localeCompare(a[1].lastDate)
    )[0]

    return categories.find(c => c.id === bestId) ?? null
  }, [merchant, history, categories, initial, suggestionDismissed])

  // Oculta la sugerencia si el usuario eligió una categoría manualmente
  const showSuggestion = suggestion && !categoryId

  function applySuggestion() {
    if (!suggestion) return
    setValue('category_id', suggestion.id)
    setSuggestionDismissed(true)
  }

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

        {/* Sugerencia de categoría */}
        {showSuggestion && (
          <div className="mt-2 flex items-center gap-2 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 rounded-xl px-3 py-2">
            <span className="text-xs text-violet-600 dark:text-violet-400 flex-1">
              💡 Sugerencia:{' '}
              <span
                className="font-semibold px-1.5 py-0.5 rounded-full text-white text-[11px]"
                style={{ backgroundColor: suggestion.color }}
              >
                {suggestion.icon ? `${suggestion.icon} ` : ''}{suggestion.name}
              </span>
            </span>
            <button
              type="button"
              onClick={applySuggestion}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 shrink-0"
            >
              Usar
            </button>
            <button
              type="button"
              onClick={() => setSuggestionDismissed(true)}
              className="text-xs text-gray-400 shrink-0"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha *</label>
        <input {...register('date')} type="date" className="input" />
        {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto *</label>
        <input {...register('amount', { valueAsNumber: true })} type="number" inputMode="decimal" step="0.01" placeholder="0.00" className="input" />
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
        <select {...register('category_id')} className="input">
          <option value="">Sin categoría</option>
          {visibleCategories.map(c => (
            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
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
