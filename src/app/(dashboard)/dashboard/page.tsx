"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, subMonths, parseISO } from "date-fns"
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Landmark,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  ChevronRight,
  Loader2,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import type { Bill, Category, Loan } from "@/types"

type BillWithCategory = Bill & { category: Category }
type DashboardData = {
  bills: BillWithCategory[]
  loans: Loan[]
  families: unknown[]
}

const NEED_CATEGORIES = [
  "rent",
  "mortgage",
  "utilities",
  "groceries",
  "insurance",
  "healthcare",
  "debt",
  "loans",
]

const STATUS_VARIANT: Record<string, "success" | "warning" | "default" | "destructive" | "secondary" | "outline"> = {
  PAID: "success",
  PENDING: "default",
  OVERRIDE: "warning",
  CANCELLED: "destructive",
}

function toDate(v: string | Date): Date {
  return typeof v === "string" ? parseISO(v) : v
}

function isInMonth(dateStr: string | Date, targetDate: Date) {
  const d = toDate(dateStr)
  const start = startOfMonth(targetDate)
  const end = endOfMonth(targetDate)
  return d >= start && d <= end
}

function sumBills(bills: BillWithCategory[]) {
  return bills.reduce((sum, b) => sum + b.amount, 0)
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [billsRes, loansRes, familyRes] = await Promise.all([
          fetch("/api/bills"),
          fetch("/api/loans"),
          fetch("/api/family"),
        ])

        if (!billsRes.ok || !loansRes.ok || !familyRes.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const [bills, loans, families] = await Promise.all([
          billsRes.json(),
          loansRes.json(),
          familyRes.json(),
        ])

        setData({ bills, loans, families })
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const {
    thisMonthTotal,
    thisMonthPaid,
    thisMonthPending,
    activeLoans,
    activeLoanBalance,
    needsTotal,
    wantsTotal,
    upcomingBills,
    monthlyTrend,
    vsLastMonth,
    vsLastYear,
    vsLastMonthLabel,
    vsLastYearLabel,
  } = useMemo(() => {
    if (!data) {
      return {
        thisMonthTotal: 0,
        thisMonthPaid: 0,
        thisMonthPending: 0,
        activeLoans: 0,
        activeLoanBalance: 0,
        needsTotal: 0,
        wantsTotal: 0,
        upcomingBills: [],
        monthlyTrend: [],
        vsLastMonth: 0,
        vsLastYear: 0,
        vsLastMonthLabel: "",
        vsLastYearLabel: "",
      }
    }

    const now = new Date()
    const { bills, loans } = data

    const loansActive = loans.filter((l) => l.status === "ACTIVE")
    const loanBalance = loansActive.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0)

    const billsThisMonth = bills.filter((b) => isInMonth(b.dueDate, now))
    const totalAmt = sumBills(billsThisMonth)
    const paidAmt = sumBills(billsThisMonth.filter((b) => b.status === "PAID"))
    const pendingAmt = totalAmt - paidAmt

    const expenseBills = billsThisMonth.filter((b) => b.category.type === "EXPENSE")
    const needs = expenseBills.filter((b) =>
      NEED_CATEGORIES.some((n) => b.category.name.toLowerCase().includes(n))
    )
    const wants = expenseBills.filter((b) =>
      !NEED_CATEGORIES.some((n) => b.category.name.toLowerCase().includes(n))
    )

    const upcoming = [...bills]
      .filter((b) => b.status !== "CANCELLED")
      .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime())
      .slice(0, 7)

    const months: { month: string; total: number; paid: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i)
      const mBills = bills.filter((b) => isInMonth(b.dueDate, d))
      months.push({
        month: format(d, "MMM"),
        total: sumBills(mBills),
        paid: sumBills(mBills.filter((b) => b.status === "PAID")),
      })
    }

    const lastMonthDate = subMonths(now, 1)
    const lastMonthBills = bills.filter((b) => isInMonth(b.dueDate, lastMonthDate))
    const lastMonthTotal = sumBills(lastMonthBills)

    const lastYearDate = subMonths(now, 12)
    const lastYearBills = bills.filter((b) => isInMonth(b.dueDate, lastYearDate))
    const lastYearTotal = sumBills(lastYearBills)

    const vsLast = lastMonthTotal ? ((totalAmt - lastMonthTotal) / lastMonthTotal) * 100 : 0
    const vsYear = lastYearTotal ? ((totalAmt - lastYearTotal) / lastYearTotal) * 100 : 0

    return {
      thisMonthTotal: totalAmt,
      thisMonthPaid: paidAmt,
      thisMonthPending: pendingAmt,
      activeLoans: loansActive.length,
      activeLoanBalance: loanBalance,
      needsTotal: sumBills(needs),
      wantsTotal: sumBills(wants),
      upcomingBills: upcoming,
      monthlyTrend: months,
      vsLastMonth: vsLast,
      vsLastYear: vsYear,
      vsLastMonthLabel: format(lastMonthDate, "MMM"),
      vsLastYearLabel: format(lastYearDate, "MMM yyyy"),
    }
  }, [data])

  const needsWantsData = useMemo(
    () => [
      { name: "Needs", value: needsTotal, color: "#22c55e" },
      { name: "Wants", value: wantsTotal, color: "#f59e0b" },
    ],
    [needsTotal, wantsTotal]
  )

  const needsWantsTotal = needsTotal + wantsTotal
  const needsPct = needsWantsTotal ? Math.round((needsTotal / needsWantsTotal) * 100) : 0
  const wantsPct = needsWantsTotal ? Math.round((wantsTotal / needsWantsTotal) * 100) : 0

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">Failed to load dashboard</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your financial overview for {format(new Date(), "MMMM yyyy")}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Monthly Bills"
          value={formatCurrency(thisMonthTotal)}
          icon={Wallet}
          gradient="from-emerald-500/10 to-emerald-500/5"
          iconColor="text-emerald-500"
        />
        <SummaryCard
          title="Paid So Far"
          value={formatCurrency(thisMonthPaid)}
          icon={Receipt}
          gradient="from-blue-500/10 to-blue-500/5"
          iconColor="text-blue-500"
        />
        <SummaryCard
          title="Remaining"
          value={formatCurrency(thisMonthPending)}
          icon={AlertCircle}
          gradient="from-orange-500/10 to-orange-500/5"
          iconColor="text-orange-500"
        />
        <SummaryCard
          title="Active Loans"
          value={`${activeLoans} loans`}
          subtitle={formatCurrency(activeLoanBalance)}
          icon={Landmark}
          gradient="from-purple-500/10 to-purple-500/5"
          iconColor="text-purple-500"
        />
      </div>

      {/* Needs vs Wants + Upcoming Bills */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Needs vs Wants Donut */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Needs vs Wants
            </CardTitle>
            <CardDescription>Expense breakdown for {format(new Date(), "MMMM")}</CardDescription>
          </CardHeader>
          <CardContent>
            {needsWantsTotal > 0 ? (
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="h-48 w-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={needsWantsData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {needsWantsData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500" />
                        <span>Needs</span>
                      </div>
                      <span className="font-medium">{formatCurrency(needsTotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500" />
                        <span>Wants</span>
                      </div>
                      <span className="font-medium">{formatCurrency(wantsTotal)}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Needs make up <strong className="text-foreground">{needsPct}%</strong> of spending</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">No expense data for this month</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Receipt className="h-5 w-5 text-muted-foreground" />
                Upcoming Bills
              </CardTitle>
              <CardDescription>Next 7 bills sorted by due date</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/bills" className="gap-1">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBills.length > 0 ? (
              <div className="space-y-1">
                {upcomingBills.map((bill) => (
                  <Link
                    key={bill.id}
                    href={`/bills/${bill.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: bill.category.color || "#6b7280" }}
                      />
                      <div>
                        <p className="text-sm font-medium leading-none">{bill.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {bill.category.name} &middot; {formatDate(bill.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(bill.amount)}
                      </span>
                      <Badge variant={STATUS_VARIANT[bill.status] || "outline"}>
                        {bill.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex h-48 items-center justify-center">
                <p className="text-sm text-muted-foreground">No upcoming bills</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <QuickStatCard
          title="vs Last Month"
          value={vsLastMonthLabel}
          change={vsLastMonth}
          current={thisMonthTotal}
          previous={null}
        />
        <QuickStatCard
          title="vs Same Month Last Year"
          value={vsLastYearLabel}
          change={vsLastYear}
          current={thisMonthTotal}
          previous={null}
        />
      </div>

      {/* Monthly Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Monthly Spending Trend
          </CardTitle>
          <CardDescription>Total and paid amounts over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${(Number(v) / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--popover))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="paid"
                  name="Paid"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  iconColor,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  iconColor: string
}) {
  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-br ${gradient} p-0.5 h-full`}>
        <div className="flex h-full flex-col justify-between rounded-[11px] bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
            <div className={`rounded-lg bg-background p-2 ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

function QuickStatCard({
  title,
  value,
  change,
  current,
  previous,
}: {
  title: string
  value: string
  change: number
  current: number | null
  previous: number | null
}) {
  const isPositive = change >= 0
  const isNeutral = change === 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <CardDescription className="text-xs">{value}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-medium",
              isNeutral
                ? "bg-muted text-muted-foreground"
                : isPositive
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            )}
          >
            {isNeutral ? null : isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" />
            )}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {isNeutral
              ? "No change"
              : isPositive
                ? "more than last period"
                : "less than last period"}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
