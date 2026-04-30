import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Category, Movement } from '../../types/database'

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
  onSubmit: (data: Omit<Movement, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

const MSI_OPTIONS = [0, 3, 6, 9, 12, 18, 24]

export default function MovementForm({ cardId, categories, onSubmit, onCancel }: MovementFormProps) {
  const today = new Date().toISOString().slice(0, 10)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
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
    // Gastos son negativos, pagos/ingresos positivos
    const signedAmount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)

    await onSubmit({
      card_id: cardId,
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
      {/* Tipo */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {(['expense', 'payment', 'income'] as const).map(t => (
          <label
            key={t}
            className={`flex-1 text-center py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              type === t ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
            }`}
          >
            <input {...register('type')} type="radio" value={t} className="sr-only" />
            {t === 'expense' ? 'Gasto' : t === 'payment' ? 'Pago tarjeta' : 'Ingreso'}
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {type === 'expense' ? 'Establecimiento' : 'Concepto'} *
          </label>
          <input {...register('merchant')} placeholder="Nombre del lugar o concepto" className="input" />
          {errors.merchant && <p className="text-red-500 text-xs mt-1">{errors.merchant.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
          <input {...register('date')} type="date" className="input" />
          {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
          <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className="input" />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
          <select {...register('category_id')} className="input">
            <option value="">Sin categoría</option>
            {visibleCategories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {type === 'expense' && (
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Meses sin intereses</label>
            <select {...register('msi_months')} className="input">
              {MSI_OPTIONS.map(m => (
                <option key={m} value={m}>{m === 0 || m === 1 ? 'Sin MSI' : `${m} meses`}</option>
              ))}
            </select>
          </div>
        )}

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <input {...register('notes')} placeholder="Opcional" className="input" />
        </div>
      </div>

      <div
        className={`rounded-xl p-3 text-sm text-center font-medium ${
          type === 'expense' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}
      >
        {type === 'expense' ? 'Este movimiento restará del balance' : 'Este movimiento sumará al balance'}
      </div>

      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : 'Registrar'}
        </button>
      </div>
    </form>
  )
}
