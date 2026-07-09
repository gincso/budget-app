"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  SaveIcon,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate, getCategoryColor } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import type { Category, Family } from "@/types"

interface BillData {
  id: string
  name: string
  amount: number
  categoryId: string
  dueDate: string
  status: string
  notes: string | null
  isRecurring: boolean
  recurringInterval: string | null
  recurringEndDate: string | null
  isVariable: boolean
  familyId: string | null
  userId: string
  paidBy: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
  category: Category
}

type BillWithCategory = BillData

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive"> = {
  PENDING: "default",
  PAID: "success",
  OVERRIDE: "warning",
  CANCELLED: "destructive",
}

export default function BillDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [bill, setBill] = useState<BillWithCategory | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [notes, setNotes] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringInterval, setRecurringInterval] = useState("MONTHLY")
  const [isVariable, setIsVariable] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [billRes, catRes, famRes] = await Promise.all([
          fetch(`/api/bills/${id}`),
          fetch("/api/categories"),
          fetch("/api/family"),
        ])
        if (!billRes.ok || !catRes.ok || !famRes.ok) throw new Error("Failed to load data")
        const [billData, cats, fams] = await Promise.all([
          billRes.json(),
          catRes.json(),
          famRes.json(),
        ])
        setBill(billData)
        setCategories(cats)
        setFamilies(fams)
        populateForm(billData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  function populateForm(b: BillWithCategory) {
    setName(b.name)
    setAmount(String(b.amount))
    setDueDate(typeof b.dueDate === "string" ? b.dueDate.split("T")[0] : "")
    setCategoryId(b.categoryId)
    setNotes(b.notes || "")
    setIsRecurring(b.isRecurring)
    setRecurringInterval(b.recurringInterval || "MONTHLY")
    setIsVariable(b.isVariable)
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {
        name: name.trim(),
        amount: Number(amount),
        dueDate: new Date(dueDate).toISOString(),
        categoryId,
        notes: notes.trim() || null,
        isRecurring,
        recurringInterval: isRecurring ? recurringInterval : null,
        isVariable,
      }

      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Failed to update bill")
      }

      const updated = await res.json()
      setBill(updated)
      setEditing(false)
      toast.success("Bill updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update bill")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusUpdate(status: string) {
    try {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update status")
      const updated = await res.json()
      setBill(updated)
      toast.success(`Bill marked as ${status}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete bill")
      toast.success("Bill deleted")
      router.push("/bills")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !bill) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">Failed to load bill</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push("/bills")}>Go Back</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/bills">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{bill.name}</h1>
            <p className="text-sm text-muted-foreground">
              <Badge variant={STATUS_VARIANT[bill.status]}>{bill.status}</Badge>
            </p>
          </div>
        </div>
        <Button variant="destructive" size="icon" onClick={() => setDeleteDialog(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {!editing && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Bill Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold tabular-nums">{formatCurrency(bill.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="text-xl font-bold">{formatDate(bill.dueDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: bill.category.color || "#6b7280" }}
                    />
                    <p className="font-medium">{bill.category.name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={STATUS_VARIANT[bill.status]}>{bill.status}</Badge>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Recurring</p>
                  <p className="font-medium">{bill.isRecurring ? `Yes - ${bill.recurringInterval}` : "No"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Variable</p>
                  <p className="font-medium">{bill.isVariable ? "Yes" : "No"}</p>
                </div>
                {bill.paidBy && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid By</p>
                    <p className="font-medium">{bill.paidBy}</p>
                  </div>
                )}
                {bill.paidAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Paid At</p>
                    <p className="font-medium">{formatDate(bill.paidAt)}</p>
                  </div>
                )}
              </div>

              {bill.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="mt-1 text-sm">{bill.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Update bill status</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {bill.status !== "PAID" && (
                <Button onClick={() => handleStatusUpdate("PAID")} className="gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Mark as Paid
                </Button>
              )}
              {bill.status !== "OVERRIDE" && (
                <Button onClick={() => handleStatusUpdate("OVERRIDE")} variant="secondary" className="gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Override
                </Button>
              )}
              {bill.status !== "CANCELLED" && (
                <Button onClick={() => handleStatusUpdate("CANCELLED")} variant="outline" className="gap-1">
                  <XCircle className="h-4 w-4" />
                  Cancel
                </Button>
              )}
              <Button variant="outline" onClick={() => setEditing(true)} className="gap-1">
                <SaveIcon className="h-4 w-4" />
                Edit Bill
              </Button>
            </CardContent>
          </Card>
        </>
      )}

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <input
                    id="amount"
                    type="number"
                    step="0.01"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <input
                    id="dueDate"
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch id="edit-recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                  <Label htmlFor="edit-recurring">Recurring</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="edit-variable" checked={isVariable} onCheckedChange={setIsVariable} />
                  <Label htmlFor="edit-variable">Variable</Label>
                </div>
              </div>

              {isRecurring && (
                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                      <SelectItem value="YEARLY">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => {
                  populateForm(bill)
                  setEditing(false)
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{bill.name}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}