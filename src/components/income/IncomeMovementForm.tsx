import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Category, IncomeAccount, IncomeMovement } from '../../types/database'

const schema = z.object({
  account_id: z.string().min(1, 'Selecciona una cuenta'),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, 'Requerido'),
  concept: z.string().min(1, 'Requerido'),
  amount: z.number({ error: 'Requerido' }).positive('Debe ser mayor a 0'),
  category_id: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface IncomeMovementFormProps {
  accounts: IncomeAccount[]
  categories: Category[]
  onSubmit: (data: Omit<IncomeMovement, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

export default function IncomeMovementForm({ accounts, categories, onSubmit, onCancel }: IncomeMovementFormProps) {
  const today = new Date().toISOString().slice(0, 10)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      account_id: accounts[0]?.id ?? '',
      type: 'income',
      date: today,
      concept: '',
      amount: undefined,
      category_id: '',
      notes: '',
    },
  })

  const type = watch('type')

  async function handleSubmitForm(data: FormData) {
    const signedAmount = data.type === 'income' ? Math.abs(data.amount) : -Math.abs(data.amount)
    await onSubmit({
      account_id: data.account_id,
      type: data.type,
      date: data.date,
      concept: data.concept,
      amount: signedAmount,
      category_id: data.category_id || null,
      notes: data.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4">
      {/* Tipo */}
      <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
        {(['income', 'expense'] as const).map(t => (
          <label
            key={t}
            className={`flex-1 text-center py-2 rounded-lg text-sm font-medium cursor-pointer transition-all ${
              type === t ? 'bg-white dark:bg-gray-700 shadow text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <input {...register('type')} type="radio" value={t} className="sr-only" />
            {t === 'income' ? 'Ingreso' : 'Egreso'}
          </label>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cuenta *</label>
        <select {...register('account_id')} className="input">
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        {errors.account_id && <p className="text-red-500 text-xs mt-1">{errors.account_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto *</label>
          <input {...register('concept')} placeholder="ej. Sueldo quincenal" className="input" />
          {errors.concept && <p className="text-red-500 text-xs mt-1">{errors.concept.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha *</label>
          <input {...register('date')} type="date" className="input" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto *</label>
          <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0.00" className="input" />
          {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
          <select {...register('category_id')} className="input">
            <option value="">Sin categoría</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
          <input {...register('notes')} placeholder="Opcional" className="input" />
        </div>
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
