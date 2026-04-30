import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, Tag, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../hooks/useCategories'
import type { Category } from '../types/database'
import Modal from '../components/ui/Modal'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CategoryForm from '../components/categories/CategoryForm'
import PageHeader from '../components/ui/PageHeader'

const TYPE_LABELS: Record<Category['type'], string> = {
  expense: 'Gasto', lent: 'Prestado', income: 'Ingreso',
}

export default function CategoriesPage() {
  const navigate = useNavigate()
  const { data: categories = [], isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  async function handleCreate(data: Omit<Category, 'id' | 'created_at' | 'user_id'>) {
    try { await createCategory.mutateAsync(data); toast.success('Categoría creada'); setShowForm(false) }
    catch { toast.error('Error al crear') }
  }
  async function handleUpdate(data: Omit<Category, 'id' | 'created_at' | 'user_id'>) {
    if (!editing) return
    try { await updateCategory.mutateAsync({ id: editing.id, ...data }); toast.success('Actualizada'); setEditing(null) }
    catch { toast.error('Error al actualizar') }
  }
  async function handleDelete() {
    if (!deleting) return
    try { await deleteCategory.mutateAsync(deleting.id); toast.success('Eliminada') }
    catch { toast.error('Error al eliminar') }
    finally { setDeleting(null) }
  }

  const grouped = {
    expense: categories.filter(c => c.type === 'expense'),
    lent: categories.filter(c => c.type === 'lent'),
    income: categories.filter(c => c.type === 'income'),
  }

  return (
    <div>
      <PageHeader>
        <div className="flex items-center gap-3 py-1">
          <button onClick={() => navigate('/ajustes')} className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="flex-1 text-xl font-bold text-gray-900 dark:text-white">Categorías</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-violet-600 text-white px-3 py-2 rounded-xl text-sm font-medium active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
            Nueva
          </button>
        </div>
      </PageHeader>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 card animate-pulse bg-gray-100 dark:bg-gray-800" />)}</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-600">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Sin categorías</p>
          </div>
        ) : (
          <div className="space-y-5">
            {(['expense', 'lent', 'income'] as const).map(type => {
              const cats = grouped[type]
              if (cats.length === 0) return null
              return (
                <div key={type}>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    {TYPE_LABELS[type]}
                  </p>
                  <div className="space-y-1.5">
                    {cats.map(cat => (
                      <div key={cat.id} className="card px-3 py-2.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: cat.color }} />
                        <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                        <button onClick={() => setEditing(cat)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleting(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showForm && <Modal title="Nueva categoría" onClose={() => setShowForm(false)}><CategoryForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} /></Modal>}
      {editing && <Modal title="Editar categoría" onClose={() => setEditing(null)}><CategoryForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} /></Modal>}
      {deleting && <ConfirmDialog message={`¿Eliminar "${deleting.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
    </div>
  )
}
