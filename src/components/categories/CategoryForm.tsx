import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Category } from '../../types/database'

const CAT_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#d946ef',
  '#f43f5e', '#fb923c', '#16a34a', '#0891b2', '#1d4ed8',
  '#7c3aed', '#9333ea', '#475569', '#94a3b8', '#78716c',
]

const schema = z.object({
  name: z.string().min(1, 'Requerido'),
  type: z.enum(['expense', 'lent', 'income']),
  color: z.string(),
})

type FormData = z.infer<typeof schema>

interface CategoryFormProps {
  initial?: Partial<Category>
  onSubmit: (data: Omit<Category, 'id' | 'created_at' | 'user_id'>) => Promise<void>
  onCancel: () => void
}

export default function CategoryForm({ initial, onSubmit, onCancel }: CategoryFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? '',
      type: initial?.type ?? 'expense',
      color: initial?.color ?? '#6366f1',
    },
  })

  const selectedColor = watch('color')

  return (
    <form onSubmit={handleSubmit(d => onSubmit({ ...d, icon: null }))} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input {...register('name')} placeholder="ej. Streaming, Gym…" className="input" />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
        <div className="flex rounded-xl bg-gray-100 p-1">
          {(['expense', 'lent', 'income'] as const).map(t => (
            <label
              key={t}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                watch('type') === t ? 'bg-white shadow text-indigo-600' : 'text-gray-500'
              }`}
            >
              <input {...register('type')} type="radio" value={t} className="sr-only" />
              {t === 'expense' ? 'Gasto' : t === 'lent' ? 'Prestado' : 'Ingreso'}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {CAT_COLORS.map(c => (
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
          {isSubmitting ? 'Guardando…' : initial ? 'Guardar cambios' : 'Crear categoría'}
        </button>
      </div>
    </form>
  )
}
