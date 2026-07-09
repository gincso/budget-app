"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Receipt,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, formatCurrency, formatDate, getCategoryColor } from "@/lib/utils"
import { toast } from "@/components/ui/toast"
import type { Bill, Category } from "@/types"

type BillWithCategory = Bill & { category: Category }

const STATUS_VARIANT = {
  PENDING: "default" as const,
  PAID: "success" as const,
  OVERRIDE: "warning" as const,
  CANCELLED: "destructive" as const,
} as const

export default function BillsPage() {
  const router = useRouter()
  const [bills, setBills] = useState<BillWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch("/api/bills")
        if (!res.ok) throw new Error("Failed to fetch bills")
        const data = await res.json()
        setBills(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchBills()
  }, [])

  const filteredBills = useMemo(() => {
    return bills.filter((bill) => {
      const matchesStatus =
        statusFilter === "All" || bill.status === statusFilter
      const matchesSearch = bill.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [bills, statusFilter, searchQuery])

  const handleDelete = useCallback(async (id: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete bill")
      setBills((prev) => prev.filter((b) => b.id !== id))
      toast.success("Bill deleted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setDeleting(false)
      setDeleteDialog(null)
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">Failed to load bills</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your recurring and one-time bills
          </p>
        </div>
        <Button asChild>
          <Link href="/bills/new" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Bill
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-9 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Search bills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERRIDE">Override</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Paid By</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                      No bills found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBills.map((bill) => (
                    <TableRow
                      key={bill.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/bills/${bill.id}`)}
                    >
                      <TableCell className="font-medium">{bill.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: bill.category.color || "#6b7280" }}
                          />
                          <span className="text-sm">{bill.category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {formatCurrency(bill.amount)}
                      </TableCell>
                      <TableCell>{formatDate(bill.dueDate)}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[bill.status]}>
                          {bill.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {bill.paidBy || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/bills/${bill.id}`)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteDialog(bill.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {filteredBills.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No bills found
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-accent"
                  onClick={() => router.push(`/bills/${bill.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"
                    >
                      <Receipt className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{bill.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {bill.category.name} &middot; {formatDate(bill.dueDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium tabular-nums">
                        {formatCurrency(bill.amount)}
                      </p>
                      <Badge variant={STATUS_VARIANT[bill.status]} className="mt-0.5">
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Bill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bill? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}