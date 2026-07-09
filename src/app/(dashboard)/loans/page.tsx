"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Landmark,
  Plus,
  Loader2,
  AlertCircle,
  Banknote,
  Percent,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency } from "@/lib/utils"
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

export default function LoansPage() {
  const router = useRouter()
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLoans() {
      try {
        const res = await fetch("/api/loans")
        if (!res.ok) throw new Error("Failed to fetch loans")
        const data = await res.json()
        setLoans(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    fetchLoans()
  }, [])

  const { totalBalance, totalPaid, activeLoans } = useMemo(() => {
    const active = loans.filter((l) => l.status === "ACTIVE")
    const balance = active.reduce(
      (sum, l) => sum + (l.totalAmount - l.paidAmount),
      0
    )
    const paid = loans.reduce((sum, l) => sum + l.paidAmount, 0)
    return {
      totalBalance: balance,
      totalPaid: paid,
      activeLoans: active.length,
    }
  }, [loans])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-36 animate-pulse rounded bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">Failed to load loans</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track and manage your loans
          </p>
        </div>
        <Button asChild>
          <Link href="/loans/new" className="gap-1">
            <Plus className="h-4 w-4" />
            Add Loan
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Loans
            </CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="flex h-32 items-center justify-center">
              <p className="text-sm text-muted-foreground">No loans yet</p>
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => {
            const progress =
              loan.totalAmount > 0
                ? Math.min((loan.paidAmount / loan.totalAmount) * 100, 100)
                : 0

            return (
              <Card
                key={loan.id}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => router.push(`/loans/${loan.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{loan.name}</h3>
                        <Badge variant={LOAN_TYPE_VARIANTS[loan.type]}>
                          {loan.type.replace(/_/g, " ")}
                        </Badge>
                        <Badge variant={LOAN_STATUS_VARIANT[loan.status]}>
                          {loan.status}
                        </Badge>
                      </div>
                      {loan.lender && (
                        <p className="text-sm text-muted-foreground">
                          Lender: {loan.lender}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold tabular-nums">
                        {formatCurrency(loan.totalAmount)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Paid: {formatCurrency(loan.paidAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{progress.toFixed(0)}% paid</span>
                      {loan.monthlyPayment && (
                        <span>Monthly: {formatCurrency(loan.monthlyPayment)}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}