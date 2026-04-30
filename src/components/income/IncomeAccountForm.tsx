import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { IncomeAccount } from '../../types/database'

const COLORS = [
  '#10b981', '#22c55e', '#06b6d4', '#0ea5e9', '#6366f1',
  '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#94a3b8',
]

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  bank: z.string().optional(),
  type: z.enum(['checking', 'savings', 'payroll', 'cash', 'other']),
  color: z.string(),
})

type FormData = z.infer<typeof schema>

const TYPE_LABELS = {
  checking: 'Débito',
  savings: 'Ahorro',
  payroll: 'Nómina',
  cash: 'Efectivo',
  other: 'Otro',
}

interface IncomeAccountFormProps {
  initial?: Partial<IncomeAccount>
  onSubmit: (data: Omit<IncomeAccount, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

export default function IncomeAccountForm({ initial, onSubmit, onCancel }: IncomeAccountFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      bank: initial?.bank ?? '',
      type: initial?.type ?? 'payroll',
      color: initial?.color ?? '#10b981',
    },
  })

  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(d => onSubmit({ ...d, bank: d.bank || null, is_active: true }))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input {...register('name')} placeholder="ej. BBVA Nómina" className="input" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
        <input {...register('bank')} placeholder="Opcional" className="input" />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <select {...register('type')} className="input">
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setValue('color', c)}
              className={`w-7 h-7 rounded-full transition-transform ${selectedColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  )
}
