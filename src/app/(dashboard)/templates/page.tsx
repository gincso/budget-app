"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency, cn } from "@/lib/utils"
import { TemplateInterval } from "@/types"

type Category = { id: string; name: string; color: string }
type Template = {
  id: string
  name: string
  amount: number
  categoryId: string
  interval: TemplateInterval
  isVariable: boolean
  notes: string | null
  active: boolean
  category?: Category
}

const INTERVAL_LABELS: Record<TemplateInterval, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Biweekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
}

const INTERVAL_VARIANTS: Record<string, "default" | "secondary" | "outline" | "success" | "warning"> = {
  WEEKLY: "default",
  BIWEEKLY: "secondary",
  MONTHLY: "outline",
  QUARTERLY: "warning",
  YEARLY: "success",
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Template | null>(null)
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [interval, setInterval] = useState<TemplateInterval>(TemplateInterval.MONTHLY)
  const [isVariable, setIsVariable] = useState(false)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/templates").then((r) => r.ok ? r.json() : []),
      fetch("/api/categories").then((r) => r.ok ? r.json() : []),
    ]).then(([t, c]) => {
      setTemplates(t)
      setCategories(c)
      setLoading(false)
    })
  }, [])

  function resetForm() {
    setName("")
    setAmount("")
    setCategoryId("")
    setInterval(TemplateInterval.MONTHLY)
    setIsVariable(false)
    setNotes("")
    setEditing(null)
  }

  function openEdit(t: Template) {
    setEditing(t)
    setName(t.name)
    setAmount(t.amount.toString())
    setCategoryId(t.categoryId)
    setInterval(t.interval)
    setIsVariable(t.isVariable)
    setNotes(t.notes ?? "")
    setDialogOpen(true)
  }

  async function handleSave() {
    const body = { name, amount: Number(amount), categoryId, interval, isVariable, notes: notes || null }
    const res = editing
      ? await fetch(`/api/templates/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    if (res.ok) {
      setDialogOpen(false)
      resetForm()
      const updated = await fetch("/api/templates").then((r) => r.ok ? r.json() : [])
      setTemplates(updated)
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" })
    if (res.ok) {
      const updated = await fetch("/api/templates").then((r) => r.ok ? r.json() : [])
      setTemplates(updated)
    }
  }

  async function toggleActive(t: Template) {
    await fetch(`/api/templates/${t.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !t.active }),
    })
    const updated = await fetch("/api/templates").then((r) => r.ok ? r.json() : [])
    setTemplates(updated)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recurring Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage recurring bill templates</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              Add Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Template" : "Add Template"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Rent" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="interval">Interval</Label>
                <Select value={interval} onValueChange={(v) => setInterval(v as TemplateInterval)}>
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INTERVAL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="variable" checked={isVariable} onCheckedChange={setIsVariable} />
                <Label htmlFor="variable">Variable amount</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleSave}>{editing ? "Save" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {templates.map((t) => {
          const cat = categories.find((c) => c.id === t.categoryId)
          return (
            <Card key={t.id} className={cn(!t.active && "opacity-60")}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  {cat && <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />}
                  <CardTitle className="text-base font-medium">{t.name}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={t.active} onCheckedChange={() => toggleActive(t)} />
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold tabular-nums">{formatCurrency(t.amount)}</span>
                  <Badge variant={INTERVAL_VARIANTS[t.interval]}>{INTERVAL_LABELS[t.interval]}</Badge>
                  {cat && <span className="text-sm text-muted-foreground">{cat.name}</span>}
                  {t.isVariable && <Badge variant="outline">Variable</Badge>}
                </div>
                {t.notes && <p className="mt-2 text-sm text-muted-foreground">{t.notes}</p>}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
