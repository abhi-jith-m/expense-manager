import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/page-header'
import { CategoryIcon } from '@/components/shared/category-icon'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useCategories, useCreateCategory, useInvalidateFinance } from '@/hooks/use-finance'
import { CATEGORY_COLORS, CATEGORY_ICONS } from '@/lib/defaults'
import { toUserMessage } from '@/lib/data/errors'
import type { Category, CategoryKind } from '@/types'

export function CategoriesPage() {
  const { client } = useAuth()
  const categories = useCategories()
  const createCategory = useCreateCategory()
  const invalidate = useInvalidateFinance()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [removeId, setRemoveId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [icon, setIcon] = useState('CircleEllipsis')
  const [color, setColor] = useState(CATEGORY_COLORS[0])
  const [parentId, setParentId] = useState<string>('')
  const items = categories.data ?? []

  function start(item?: Category) {
    setEditing(item ?? null)
    setName(item?.name ?? '')
    setKind(item?.kind ?? 'expense')
    setIcon(item?.icon ?? 'CircleEllipsis')
    setColor(item?.color ?? CATEGORY_COLORS[0])
    setParentId(item?.parentId ?? '')
    setOpen(true)
  }

  return (
    <div className="page-stack">
      <PageHeader title="Categories" description="Icons and colors stay consistent across the app. Categories in use cannot be deleted." actions={<Button className="w-full sm:w-auto" onClick={() => start()}>Add category</Button>} />
      <div className="grid gap-3 md:grid-cols-2">
        {items.filter((item) => !item.parentId).map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-3">
              <CategoryIcon name={item.icon} color={item.color} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs capitalize text-muted-foreground">{item.kind}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {items.filter((child) => child.parentId === item.id).map((child) => (
                    <button key={child.id} className="rounded-full bg-muted px-2 py-0.5 text-xs" onClick={() => start(child)}>{child.name}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="outline" onClick={() => start(item)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => setRemoveId(item.id)}>Delete</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle></DialogHeader>
          <form className="grid gap-3" onSubmit={async (event) => {
            event.preventDefault()
            try {
              if (editing) {
                await client.updateCategory(editing.id, { name, kind, icon, color, parentId: parentId || null })
                toast.success('Category updated')
              } else {
                await createCategory.mutateAsync({ name, kind, icon, color, parentId: parentId || null, sortOrder: items.length, isSystem: false })
                toast.success('Category created')
              }
              invalidate()
              setOpen(false)
            } catch (error) {
              toast.error(toUserMessage(error))
            }
          }}>
            <div className="space-y-1.5"><Label htmlFor="name">Name</Label><Input id="name" value={name} onChange={(event) => setName(event.target.value)} required /></div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as CategoryKind)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Parent</Label>
              <Select value={parentId || 'none'} onValueChange={(value) => setParentId(value === 'none' ? '' : value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {items.filter((item) => !item.parentId && item.id !== editing?.id).map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((item) => (
                <button type="button" key={item} onClick={() => setIcon(item)} className={icon === item ? 'rounded-full ring-2 ring-ring' : ''}>
                  <CategoryIcon name={item} color={color} size="sm" />
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((item) => (
                <button type="button" key={item} className="size-6 rounded-full" style={{ background: item }} onClick={() => setColor(item)} aria-label={item} />
              ))}
            </div>
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog open={Boolean(removeId)} onOpenChange={() => setRemoveId(null)} title="Delete category?" description="This is blocked if transactions still use the category." confirmLabel="Delete" destructive onConfirm={() => {
        if (!removeId) return
        void client.deleteCategory(removeId).then(() => {
          toast.success('Category deleted')
          invalidate()
          setRemoveId(null)
        }).catch((error) => toast.error(toUserMessage(error)))
      }} />
    </div>
  )
}
