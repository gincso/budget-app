"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, AlertCircle, SaveIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/toast"
import type { Category, Family } from "@/types"

export default function NewBillPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [families, setFamilies] = useState<Family[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [notes, setNotes] = useState("")
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringInterval, setRecurringInterval] = useState("MONTHLY")
  const [isVariable, setIsVariable] = useState(false)
  const [familyBill, setFamilyBill] = useState(false)
  const [familyId, setFamilyId] = useState("")

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, famRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/family"),
        ])
        if (!catRes.ok || !famRes.ok) throw new Error("Failed to load form data")
        const [cats, fams] = await Promise.all([
          catRes.json(),
          famRes.json(),
        ])
        setCategories(cats)
        setFamilies(fams)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function validate() {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = "Name is required"
    if (!amount || Number(amount) <= 0) errs.amount = "Amount must be greater than 0"
    if (!dueDate) errs.dueDate = "Due date is required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

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
        familyId: familyBill ? familyId : null,
      }

      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Failed to create bill")
      }

      toast.success("Bill created")
      router.push("/bills")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create bill")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">Failed to load form</p>
        <p className="text-sm text-muted-foreground">{fetchError}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/bills">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Bill</h1>
          <p className="text-sm text-muted-foreground">Create a new bill entry</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <input
                id="name"
                className={`flex h-9 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.name ? "border-destructive" : "border-input"}`}
                placeholder="e.g. Electric Bill"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  className={`flex h-9 w-full rounded-md bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.amount ? "border-destructive" : "border-input"} border`}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <input
                  id="dueDate"
                  type="date"
                  className={`flex h-9 w-full rounded-md bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${errors.dueDate ? "border-destructive" : "border-input"} border`}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
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
                placeholder="Optional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
                <Label htmlFor="recurring">Recurring</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="variable" checked={isVariable} onCheckedChange={setIsVariable} />
                <Label htmlFor="variable">Is Variable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="familyBill" checked={familyBill} onCheckedChange={setFamilyBill} />
                <Label htmlFor="familyBill">Family Bill</Label>
              </div>
            </div>

            {isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="recurringInterval">Recurring Interval</Label>
                <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                  <SelectTrigger className="w-full">
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

            {familyBill && families.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="family">Family</Label>
                <Select value={familyId} onValueChange={setFamilyId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a family" />
                  </SelectTrigger>
                  <SelectContent>
                    {families.map((fam) => (
                      <SelectItem key={fam.id} value={fam.id}>
                        {fam.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4">
              <Button variant="outline" asChild>
                <Link href="/bills">Cancel</Link>
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
                    Save Bill
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

