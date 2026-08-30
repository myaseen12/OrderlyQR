'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useAdmin } from '@/app/admin/context'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmationModal } from '@/components/ui/ConfirmationModal'
import { TicketDivider } from '@/components/ui/TicketDivider'
import { PageHeader } from '@/components/ui/PageHeader'
import { 
  Layers, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Loader2 as Loader,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react'

interface CategoryType {
  id: string
  name: string
  description: string
  sort_order: number
  is_active: boolean
}

export default function AdminCategoriesPage() {
  const { restaurant } = useAdmin()
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Form Fields State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sortOrder, setSortOrder] = useState('0')
  const [formError, setFormError] = useState('')

  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Load categories
  const loadCategories = async () => {
    if (!restaurant?.id) return
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order')

      if (!error && data) {
        setCategories(data as any)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [restaurant?.id])

  // Form Open Trigger
  const handleOpenAddForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    // Set default sort order to be highest + 10
    const maxOrder = categories.reduce((max, c) => c.sort_order > max ? c.sort_order : max, 0)
    setSortOrder((maxOrder + 10).toString())
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (cat: CategoryType) => {
    setEditingId(cat.id)
    setName(cat.name)
    setDescription(cat.description || '')
    setSortOrder(cat.sort_order.toString())
    setFormError('')
    setIsFormOpen(true)
  }

  // Delete Trigger
  const triggerDeleteConfirm = (id: string) => {
    setDeleteTargetId(id)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteCategory = async () => {
    if (!deleteTargetId) return

    try {
      // Check if category contains active items
      const { count, error: countErr } = await supabase
        .from('menu_items')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', deleteTargetId)

      if (!countErr && count && count > 0) {
        alert(`Cannot delete category: it currently contains ${count} dish item(s). Please reassign or remove these items first.`)
        return
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deleteTargetId)

      if (error) {
        alert(`Failed to delete category: ${error.message}`)
        return
      }

      setCategories(prev => prev.filter(c => c.id !== deleteTargetId))
    } catch (err: any) {
      alert(`Error deleting category: ${err.message || err}`)
    } finally {
      setIsDeleteModalOpen(false)
      setDeleteTargetId(null)
    }
  }

  // Toggle category active status
  const handleToggleActive = async (cat: CategoryType) => {
    const nextActive = !cat.is_active
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: nextActive })
        .eq('id', cat.id)

      if (error) {
        alert(`Failed to update visibility: ${error.message}`)
        return
      }

      setCategories(prev => 
        prev.map(c => c.id === cat.id ? { ...c, is_active: nextActive } : c)
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Reordering logic
  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categories.length) return

    // Order strictly by sort_order
    const listCopy = [...categories].sort((a, b) => a.sort_order - b.sort_order)
    
    // Normalize to strict spaces of 10 to clear duplicates
    for (let i = 0; i < listCopy.length; i++) {
      listCopy[i].sort_order = (i + 1) * 10
    }

    // Swap sort orders
    const temp = listCopy[index].sort_order
    listCopy[index].sort_order = listCopy[targetIndex].sort_order
    listCopy[targetIndex].sort_order = temp

    // Save swaps
    const p1 = supabase.from('categories').update({ sort_order: listCopy[index].sort_order }).eq('id', listCopy[index].id)
    const p2 = supabase.from('categories').update({ sort_order: listCopy[targetIndex].sort_order }).eq('id', listCopy[targetIndex].id)

    const [r1, r2] = await Promise.all([p1, p2])
    if (r1.error || r2.error) {
      alert('Failed to save category order changes.')
      return
    }

    await loadCategories()
  }

  // Submit Form Validation & Save
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant?.id) return

    // Form validations
    if (!name.trim()) {
      setFormError('Category Name is required.')
      return
    }

    // Check unique category name
    const exists = categories.some(
      c => c.name.toLowerCase().trim() === name.toLowerCase().trim() && c.id !== editingId
    )
    if (exists) {
      setFormError('A category with this name already exists in your restaurant.')
      return
    }

    setSubmitting(true)
    setFormError('')

    const payload = {
      name: name.trim(),
      description: description.trim(),
      sort_order: parseInt(sortOrder) || 0,
      restaurant_id: restaurant.id,
      is_active: true
    }

    try {
      if (editingId) {
        // Edit category
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editingId)

        if (error) {
          setFormError(`Failed to update category: ${error.message}`)
          return
        }
      } else {
        // Add new category
        const { error } = await supabase
          .from('categories')
          .insert(payload)

        if (error) {
          setFormError(`Failed to create category: ${error.message}`)
          return
        }
      }

      setIsFormOpen(false)
      await loadCategories()
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-24">
        <Loader className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 select-none max-w-4xl">
      
      {/* Header controls */}
      <PageHeader
        title={isFormOpen ? (editingId ? 'Edit Category' : 'Register New Category') : 'Menu Categories'}
        description="Manage and sort sections filtering user menus"
        fallbackUrl="/admin"
        backLabel={isFormOpen ? 'Categories' : 'Dashboard'}
        showBack={true}
        breadcrumbs={isFormOpen ? [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Categories', href: '/admin/categories' },
          { label: editingId ? 'Edit Category' : 'Add Category' }
        ] : [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Categories' }
        ]}
        actions={!isFormOpen ? (
          <Button size="sm" onClick={handleOpenAddForm} className="text-xs font-mono gap-1">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        ) : undefined}
      />

      {/* Form Card */}
      {isFormOpen && (
        <Card className="bg-white border-2 border-dashed border-primary/20 max-w-md">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-mono text-sm font-bold text-primary uppercase">
              {editingId ? 'Edit Category' : 'Register New Category'}
            </h3>
            
            {formError && (
              <div className="p-3 bg-red-55/10 border border-red-200 text-red-700 rounded-lg text-xs font-mono flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Starters"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Sort Index</label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full text-xs px-3 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Description</label>
                <textarea
                  placeholder="Appetizers, woodfired dishes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] resize-none"
                />
              </div>

              <div className="flex justify-between items-center gap-2 pt-2 border-t border-ticket-edge">
                {editingId ? (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-3 font-mono text-xs text-red-500 border-dashed border-red-200 hover:bg-red-50 gap-1" 
                    onClick={() => {
                      setIsFormOpen(false)
                      triggerDeleteConfirm(editingId)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete Category
                  </Button>
                ) : <div />}

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-4 font-mono text-xs" 
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    type="submit" 
                    size="sm" 
                    disabled={submitting} 
                    className="h-9 px-5 font-mono text-xs gap-1"
                  >
                    {submitting ? (
                      <>
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Save Category
                      </>
                    )}
                  </Button>
                </div>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid List */}
      {categories.length === 0 ? (
        <div className="text-center py-20 bg-white border border-ticket-edge rounded-xl">
          <Layers className="h-10 w-10 mx-auto text-ink/15 mb-3" />
          <h3 className="font-bold text-ink">Categories List Empty</h3>
          <p className="text-xs text-ink/50 mt-1">Add your first category section to structure your menu.</p>
          <Button size="sm" className="mt-4 text-xs font-mono gap-1" onClick={handleOpenAddForm}>
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {categories.map((cat, index) => (
            <Card key={cat.id} className={`bg-white border ${!cat.is_active ? 'opacity-65' : ''}`}>
              <CardContent className="p-5 flex flex-col justify-between h-44">
                
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-ink">{cat.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={cat.is_active ? 'sage' : 'secondary'} className="font-mono text-[9px]">
                        {cat.is_active ? 'active' : 'hidden'}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink/60 line-clamp-2 mt-2 leading-relaxed">
                    {cat.description || 'No description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-stone-50 mt-auto flex justify-between items-center">
                  
                  {/* Reordering Up/Down controls */}
                  <div className="flex gap-1 bg-background border border-ticket-edge p-0.5 rounded-lg">
                    <button
                      disabled={index === 0}
                      onClick={() => handleMoveCategory(index, 'up')}
                      className="h-6 w-6 flex items-center justify-center text-ink/50 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                      title="Move up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={index === categories.length - 1}
                      onClick={() => handleMoveCategory(index, 'down')}
                      className="h-6 w-6 flex items-center justify-center text-ink/50 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                      title="Move down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    {/* Toggle Active status */}
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className="h-7 w-7 border border-ticket-edge bg-background hover:bg-ink/5 rounded flex items-center justify-center text-ink/60"
                      title={cat.is_active ? 'Disable category' : 'Enable category'}
                    >
                      {cat.is_active ? <Eye className="h-3.5 w-3.5 text-sage-hover" /> : <EyeOff className="h-3.5 w-3.5 text-ink/30" />}
                    </button>

                    <button
                      onClick={() => handleOpenEditForm(cat)}
                      className="h-7 w-7 border border-ticket-edge bg-background hover:bg-ink/5 rounded flex items-center justify-center text-ink/60"
                      title="Edit details"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={() => triggerDeleteConfirm(cat.id)}
                      className="h-7 w-7 border border-ticket-edge bg-background hover:bg-red-50 text-red-500 rounded flex items-center justify-center"
                      title="Delete category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                </div>

              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Category?"
        message="Are you sure you want to delete this menu category? This action cannot be undone, and dishes associated with it will lose their category association."
        confirmText="Delete Category"
        isDestructive
        onConfirm={handleDeleteCategory}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setDeleteTargetId(null)
        }}
      />

    </div>
  )
}
