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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import type { Loan } from "@/types"

const LOAN_TYPE_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  MORTGAGE: "default",
  CAR: "secondary",
  PERSONAL: "outline",
  STUDENT: "secondary",
  CREDIT_CARD: "destructive",
  OTHER: "outline",
}

const LOAN_STATUS_VARIANT: Record<string, "success" | "default" | "destructive"> = {
  ACTIVE: "success",
  PAID: "default",
  DEFAULTED: "destructive",
}

export default function LoanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loan, setLoan] = useState<Loan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState("")
  const [totalAmount, setTotalAmount] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [monthlyPayment, setMonthlyPayment] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [type, setType] = useState("PERSONAL")
  const [lender, setLender] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function fetchLoan() {
      try {
        const res = await fetch(`/api/loans/${id}`)
        if (!res.ok) throw new Error("Failed to fetch loan")
        const data = await res.json()
        setLoan(data)
        populateForm(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchLoan()
  }, [id])

  function populateForm(l: Loan) {
    setName(l.name)
    setTotalAmount(String(l.totalAmount))
    setInterestRate(l.interestRate ? String(l.interestRate) : "")
    setMonthlyPayment(l.monthlyPayment ? String(l.monthlyPayment) : "")
    setStartDate(typeof l.startDate === "string" ? l.startDate.split("T")[0] : "")
    setEndDate(l.endDate ? (typeof l.endDate === "string" ? l.endDate.split("T")[0] : "") : "")
    setType(l.type)
    setLender(l.lender || "")
    setNotes(l.notes || "")
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {
      name: name.trim(),
        totalAmount: Number(totalAmount),
        interestRate: interestRate ? Number(interestRate) : null,
        monthlyPayment: monthlyPayment ? Number(monthlyPayment) : null,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        type,
        lender: lender.trim() || null,
        notes: notes.trim() || null,
      }

      const res = await fetch(`/api/loans/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Failed to update loan")
      }

      const updated = await res.json()
      setLoan(updated)
      setEditing(false)
      toast.success("Loan updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update loan")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/loans/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete loan")
      toast.success("Loan deleted")
      router.push("/loans")
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

  if (error || !loan) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">Failed to load loan</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => router.push("/loans")}>Go Back</Button>
      </div>
    )
  }

  const progress =
    loan.totalAmount > 0
      ? Math.min((loan.paidAmount / loan.totalAmount) * 100, 100)
      : 0

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/loans">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{loan.name}</h1>
            <div className="flex items-center gap-2">
              <Badge variant={LOAN_TYPE_VARIANTS[loan.type]}>
                {loan.type.replace(/_/g, " ")}
              </Badge>
              <Badge variant={LOAN_STATUS_VARIANT[loan.status]}>
                {loan.status}
              </Badge>
            </div>
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
              <CardTitle>Progress</CardTitle>
              <CardDescription>
                {formatCurrency(loan.paidAmount)} paid of {formatCurrency(loan.totalAmount)} ({progress.toFixed(1)}%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-4 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-xl font-bold tabular-nums">{formatCurrency(loan.totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Paid Amount</p>
                  <p className="text-xl font-bold tabular-nums">{formatCurrency(loan.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-xl font-bold tabular-nums">
                    {formatCurrency(loan.totalAmount - loan.paidAmount)}
                  </p>
                </div>
                {loan.monthlyPayment && (
                  <div>
                    <p className="text-sm text-muted-foreground">Monthly Payment</p>
                    <p className="text-xl font-bold tabular-nums">{formatCurrency(loan.monthlyPayment)}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                {loan.interestRate && (
                  <div>
                    <p className="text-sm text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{loan.interestRate}%</p>
                  </div>
                )}
                {loan.lender && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lender</p>
                    <p className="font-medium">{loan.lender}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">{formatDate(loan.startDate)}</p>
                </div>
                {loan.endDate && (
                  <div>
                    <p className="text-sm text-muted-foreground">End Date</p>
                    <p className="font-medium">{formatDate(loan.endDate)}</p>
                  </div>
                )}
              </div>

              {loan.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="mt-1 text-sm">{loan.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button variant="outline" onClick={() => { populateForm(loan); setEditing(true) }} className="gap-1">
              <SaveIcon className="h-4 w-4" />
              Edit Loan
            </Button>
          </div>
        </>
      )}

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>Edit Loan</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <input
                  id="name"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount">Total Amount ($)</Label>
                  <input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interestRate">Interest Rate (%)</Label>
                  <input
                    id="interestRate"
                    type="number"
                    step="0.01"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">Monthly Payment ($)</Label>
                  <input
                    id="monthlyPayment"
                    type="number"
                    step="0.01"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORTGAGE">Mortgage</SelectItem>
                      <SelectItem value="CAR">Car</SelectItem>
                      <SelectItem value="PERSONAL">Personal</SelectItem>
                      <SelectItem value="STUDENT">Student</SelectItem>
                      <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <input
                    id="startDate"
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <input
                    id="endDate"
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lender">Lender</Label>
                <input
                  id="lender"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={lender}
                  onChange={(e) => setLender(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { populateForm(loan); setEditing(false) }}>
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
            <DialogTitle>Delete Loan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{loan.name}&rdquo;? This action cannot be undone.
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