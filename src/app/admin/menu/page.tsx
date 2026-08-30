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
import { formatCurrency } from '@/utils/currency'
import { 
  Coffee, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy,
  Check, 
  X, 
  Loader2 as Loader, 
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  ArrowUp,
  ArrowDown,
  Info
} from 'lucide-react'

interface MenuItemType {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  is_available: boolean
  category_id: string
  sort_order: number
}

interface CategoryType {
  id: string
  name: string
}

export default function AdminMenuPage() {
  const { restaurant } = useAdmin()
  const [items, setItems] = useState<MenuItemType[]>([])
  const [categories, setCategories] = useState<CategoryType[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  // Form Fields State
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [imageUrl, setImageUrl] = useState('🍔')
  const [isAvailable, setIsAvailable] = useState(true)
  const [categoryId, setCategoryId] = useState('')
  const [formError, setFormError] = useState('')

  // Delete Confirmation Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Load menu items & categories
  const loadMenuData = async () => {
    if (!restaurant?.id) return
    try {
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order')

      if (catData) {
        setCategories(catData)
      }

      const { data: itemData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order')

      if (itemData) {
        setItems(itemData)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenuData()
  }, [restaurant?.id])

  // Form Actions
  const handleOpenAddForm = () => {
    setEditingId(null)
    setName('')
    setDescription('')
    setPrice('')
    setImageUrl('🍔')
    setIsAvailable(true)
    if (categories.length > 0) {
      setCategoryId(categories[0].id)
    }
    setFormError('')
    setIsFormOpen(true)
  }

  const handleOpenEditForm = (item: MenuItemType) => {
    setEditingId(item.id)
    setName(item.name)
    setDescription(item.description || '')
    setPrice(item.price.toString())
    setImageUrl(item.image_url || '🍔')
    setIsAvailable(item.is_available)
    setCategoryId(item.category_id || '')
    setFormError('')
    setIsFormOpen(true)
  }

  // Delete
  const triggerDeleteConfirm = (id: string) => {
    setDeleteTargetId(id)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteItem = async () => {
    if (!deleteTargetId) return

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', deleteTargetId)

      if (error) {
        alert(`Failed to delete: ${error.message}`)
        return
      }

      setItems(prev => prev.filter(item => item.id !== deleteTargetId))
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleteModalOpen(false)
      setDeleteTargetId(null)
    }
  }

  // Toggle item availability directly
  const handleToggleAvailability = async (item: MenuItemType) => {
    const nextAvailability = !item.is_available
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: nextAvailability })
        .eq('id', item.id)

      if (error) {
        alert(`Failed to update item availability: ${error.message}`)
        return
      }

      setItems(prev => 
        prev.map(i => i.id === item.id ? { ...i, is_available: nextAvailability } : i)
      )
    } catch (err) {
      console.error(err)
    }
  }

  // Reordering of items within a category
  const handleMoveItem = async (catId: string, index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const catItems = [...items].filter(i => i.category_id === catId).sort((a, b) => a.sort_order - b.sort_order)
    
    if (targetIndex < 0 || targetIndex >= catItems.length) return

    // Normalize to strict sequential increments
    for (let i = 0; i < catItems.length; i++) {
      catItems[i].sort_order = (i + 1) * 10
    }

    // Swap orders
    const temp = catItems[index].sort_order
    catItems[index].sort_order = catItems[targetIndex].sort_order
    catItems[targetIndex].sort_order = temp

    // Save swaps
    const p1 = supabase.from('menu_items').update({ sort_order: catItems[index].sort_order }).eq('id', catItems[index].id)
    const p2 = supabase.from('menu_items').update({ sort_order: catItems[targetIndex].sort_order }).eq('id', catItems[targetIndex].id)

    const [r1, r2] = await Promise.all([p1, p2])
    if (r1.error || r2.error) {
      alert('Failed to save menu item ordering.')
      return
    }

    await loadMenuData()
  }

  // Duplicate Menu Item action
  const handleDuplicateItem = async (item: MenuItemType) => {
    if (!restaurant?.id) return
    const duplicatePayload = {
      restaurant_id: restaurant.id,
      category_id: item.category_id,
      name: `${item.name} (Copy)`,
      description: item.description,
      price: item.price,
      image_url: item.image_url,
      is_available: item.is_available,
      sort_order: item.sort_order + 1
    }

    const { error } = await supabase.from('menu_items').insert(duplicatePayload)
    if (error) {
      alert(`Failed to duplicate item: ${error.message}`)
      return
    }

    // Refresh UI
    setItems(prev => [...prev, { ...item, id: `temp-${Date.now()}`, name: `${item.name} (Copy)` }])
    await loadMenuData()
  }

  // Supabase image upload logic
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !restaurant?.id) return

    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setFormError('Image size exceeds 2MB limit.')
      return
    }

    setUploading(true)
    setFormError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${restaurant.id}/${fileName}`

      // Upload file to bucket 'menu-images'
      const { error: uploadError } = await supabase.storage
        .from('menu-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL
      const { data } = supabase.storage
        .from('menu-images')
        .getPublicUrl(filePath)

      if (data?.publicUrl) {
        setImageUrl(data.publicUrl)
      }
    } catch (err: any) {
      setFormError(`Image upload failed: ${err.message || err}. Ensure you have initialized the 'menu-images' bucket in Supabase storage and enabled public read access.`)
    } finally {
      setUploading(false)
    }
  }

  // Submit Menu Item form (Add / Edit) with validation
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant?.id) return

    // Validations
    if (!name.trim()) {
      setFormError('Dish Name is required.')
      return
    }

    const itemPrice = parseFloat(price)
    if (isNaN(itemPrice) || itemPrice < 0) {
      setFormError('Price must be a positive number.')
      return
    }

    if (!categoryId) {
      setFormError('Please select a valid category.')
      return
    }

    setSubmitting(true)
    setFormError('')

    // Set default sort index
    const catItems = items.filter(i => i.category_id === categoryId)
    const maxOrder = catItems.reduce((max, i) => i.sort_order > max ? i.sort_order : max, 0)

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: itemPrice,
      image_url: imageUrl,
      is_available: isAvailable,
      category_id: categoryId,
      restaurant_id: restaurant.id,
      sort_order: editingId ? undefined : maxOrder + 10 // only set highest on insert
    }

    try {
      if (editingId) {
        // Edit record
        const { error } = await supabase
          .from('menu_items')
          .update(payload)
          .eq('id', editingId)

        if (error) {
          setFormError(`Failed to update item: ${error.message}`)
          return
        }
      } else {
        // Add new record
        const { error } = await supabase
          .from('menu_items')
          .insert(payload)

        if (error) {
          setFormError(`Failed to create item: ${error.message}`)
          return
        }
      }

      setIsFormOpen(false)
      await loadMenuData()
    } catch (err: any) {
      setFormError(err.message || 'An unexpected error occurred.')
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
    <div className="space-y-6 select-none">
      
      {/* Header controls */}
      <PageHeader
        title={isFormOpen ? (editingId ? 'Edit Dish Details' : 'Register New Dish') : 'Menu Manager'}
        description="Manage and organize dish availability, images, and sorting"
        fallbackUrl="/admin"
        backLabel={isFormOpen ? 'Menu' : 'Dashboard'}
        showBack={true}
        breadcrumbs={isFormOpen ? [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Menu Manager', href: '/admin/menu' },
          { label: editingId ? 'Edit Dish' : 'Add Dish' }
        ] : [
          { label: 'Dashboard', href: '/admin' },
          { label: 'Menu Manager' }
        ]}
        actions={categories.length > 0 && !isFormOpen ? (
          <Button size="sm" onClick={handleOpenAddForm} className="text-xs font-mono gap-1">
            <Plus className="h-4 w-4" />
            Add Menu Item
          </Button>
        ) : undefined}
      />

      {/* Form Card */}
      {isFormOpen && (
        <Card className="bg-white border-2 border-dashed border-primary/20 max-w-lg">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-mono text-sm font-bold text-primary uppercase">
              {editingId ? 'Edit Dish Details' : 'Register New Dish'}
            </h3>

            {formError && (
              <div className="p-3 bg-red-55/10 border border-red-200 text-red-700 rounded-lg text-xs font-mono flex items-center gap-1.5 leading-relaxed">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}
            
            <form onSubmit={handleSubmitForm} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Dish Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Rustique Smash Burger"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs px-3 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full text-xs px-3 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono text-[11px]"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full text-xs px-3 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>

                <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Emoji / Icon shortcut</label>
                  <input
                    type="text"
                    required
                    placeholder="🍔"
                    value={imageUrl.length <= 4 ? imageUrl : '🍔'}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full text-xs px-3 h-10 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary text-center font-mono"
                  />
                </div>

              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-ink/50 uppercase block">Description</label>
                <textarea
                  placeholder="Ingredients, preparation styles..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-ticket-edge bg-background focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] resize-none leading-relaxed"
                />
              </div>

              {/* Supabase Image File Upload */}
              <div className="space-y-1.5 border-t border-ticket-edge pt-3.5">
                <label className="text-[10px] font-mono font-bold text-primary uppercase block">Or Upload Real Dish Image</label>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center justify-center gap-2 border border-dashed border-ticket-edge rounded-lg bg-background hover:bg-ink/5 cursor-pointer px-4 h-10 text-xs font-mono font-semibold transition-colors">
                    {uploading ? (
                      <>
                        <Loader className="h-4 w-4 animate-spin text-primary" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 text-ink/50" />
                        Choose Photo
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  
                  {imageUrl.startsWith('http') && (
                    <div className="text-[10px] font-mono text-sage-hover truncate max-w-[200px] flex items-center gap-1">
                      <Check className="h-3.5 w-3.5" />
                      Image linked successfully
                    </div>
                  )}
                </div>
              </div>

              {/* Checkbox availability */}
              <label className="flex items-center gap-2 text-xs font-semibold text-ink cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-ticket-edge accent-primary"
                />
                Available in menu listing
              </label>

              <div className="flex justify-end gap-2 pt-2 border-t border-ticket-edge">
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
                      Save Dish
                    </>
                  )}
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
      )}

      {/* No Categories setup block */}
      {categories.length === 0 && (
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl flex gap-3 text-red-700 text-xs">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="space-y-1">
            <h4 className="font-bold">No Menu Categories Registered!</h4>
            <p className="text-red-650">
              You must register at least one menu category (e.g. "Grill", "Beverages") in the Categories Panel before adding menu items.
            </p>
          </div>
        </div>
      )}

      {/* List Empty State */}
      {categories.length > 0 && items.length === 0 && !isFormOpen && (
        <div className="text-center py-20 bg-white border border-ticket-edge rounded-xl">
          <Coffee className="h-10 w-10 mx-auto text-ink/15 mb-3" />
          <h3 className="font-bold text-ink">Dish Directory Empty</h3>
          <p className="text-xs text-ink/50 mt-1">Add your first appetizer or main dish to begin serving.</p>
          <Button size="sm" className="mt-4 text-xs font-mono gap-1" onClick={handleOpenAddForm}>
            <Plus className="h-4 w-4" />
            Add First Dish
          </Button>
        </div>
      )}

      {/* Categories Grouping Container */}
      <div className="space-y-8">
        {categories.map(cat => {
          // Sort items dynamically by sort_order
          const catItems = items
            .filter(i => i.category_id === cat.id)
            .sort((a, b) => a.sort_order - b.sort_order)

          if (catItems.length === 0) return null

          return (
            <div key={cat.id} className="space-y-4">
              <h3 className="font-mono text-xs font-bold text-ink/50 uppercase tracking-widest border-b border-ticket-edge pb-1">
                {cat.name} ({catItems.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {catItems.map((item, index) => (
                  <Card key={item.id} className={`hover:shadow-ticket-hover transition-all border ${!item.is_available ? 'opacity-65' : ''}`}>
                    <CardContent className="p-4 flex gap-4">
                      
                      {/* Emoji Icon or Uploaded Image */}
                      <div className="h-14 w-14 bg-background border border-ticket-edge rounded-lg flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                        {item.image_url.startsWith('http') ? (
                          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                        ) : (
                          item.image_url || '🍔'
                        )}
                      </div>

                      {/* Content details */}
                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="font-bold text-xs truncate text-ink">{item.name}</h4>
                            <span className="font-mono text-xs font-bold text-primary">{formatCurrency(item.price)}</span>
                          </div>
                          <p className="text-[10px] text-ink/60 line-clamp-2 mt-1 leading-relaxed">
                            {item.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Controls */}
                        <div className="flex justify-between items-center mt-3 pt-2 border-t border-stone-50">
                          
                          {/* Reordering controls */}
                          <div className="flex gap-0.5 bg-background border border-ticket-edge p-0.5 rounded-lg">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveItem(cat.id, index, 'up')}
                              className="h-5 w-5 flex items-center justify-center text-ink/50 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                              title="Move up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              disabled={index === catItems.length - 1}
                              onClick={() => handleMoveItem(cat.id, index, 'down')}
                              className="h-5 w-5 flex items-center justify-center text-ink/50 hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                              title="Move down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="flex gap-1.5">
                            {/* Toggle availability */}
                            <button 
                              onClick={() => handleToggleAvailability(item)}
                              className="h-7 w-7 border border-ticket-edge bg-background hover:bg-ink/5 rounded flex items-center justify-center text-ink/65"
                              title={item.is_available ? 'Hide dish' : 'Show dish'}
                            >
                              {item.is_available ? <Eye className="h-3.5 w-3.5 text-sage-hover" /> : <EyeOff className="h-3.5 w-3.5 text-ink/30" />}
                            </button>

                            <button
                              onClick={() => handleOpenEditForm(item)}
                              className="h-7 w-7 border border-ticket-edge bg-background hover:bg-ink/5 rounded flex items-center justify-center text-ink/60"
                              title="Edit item"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>

                            <button
                              onClick={() => handleDuplicateItem(item)}
                              className="h-7 w-7 border border-ticket-edge bg-background hover:bg-ink/5 rounded flex items-center justify-center text-ink/60"
                              title="Duplicate item"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            
                            <button
                              onClick={() => triggerDeleteConfirm(item.id)}
                              className="h-7 w-7 border border-ticket-edge bg-background hover:bg-red-50 text-red-500 rounded flex items-center justify-center"
                              title="Delete item"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Menu Dish?"
        message="Are you sure you want to delete this menu dish? This action will permanently remove it from the database and menu selections."
        confirmText="Delete Dish"
        isDestructive
        onConfirm={handleDeleteItem}
        onCancel={() => {
          setIsDeleteModalOpen(false)
          setDeleteTargetId(null)
        }}
      />

    </div>
  )
}
