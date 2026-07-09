"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  Download,
  FileText,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { cn, formatCurrency } from "@/lib/utils"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

type CategoryBreakdown = {
  category: string
  color: string
  total: number
  count: number
  percentage: number
}

type PaidByBreakdown = {
  name: string
  total: number
  count: number
}

type ReportData = {
  totalSpending: number
  vsLastMonth: number
  vsLastMonthPercentage: number
  vsLastYear: number
  vsLastYearPercentage: number
  categoryBreakdown: CategoryBreakdown[]
  paidByBreakdown: PaidByBreakdown[]
}

const COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#6366f1",
]

export default function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports?month=${month + 1}&year=${year}`)
      if (!res.ok) throw new Error("Failed to fetch reports")
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { fetchReports() }, [fetchReports])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else { setMonth((m) => m - 1) }
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else { setMonth((m) => m + 1) }
  }

  const pieData = useMemo(() => {
    if (!data) return []
    return data.categoryBreakdown.map((cat, i) => ({
      name: cat.category,
      value: cat.total,
      color: cat.color || COLORS[i % COLORS.length],
    }))
  }, [data])

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
        <p className="text-lg font-medium text-destructive">Failed to load reports</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={fetchReports}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visual analytics for your spending
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={`/api/reports/export?format=csv&month=${month + 1}&year=${year}`}>
              <FileText className="h-4 w-4" />
              CSV
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            asChild
          >
            <a href={`/api/reports/export?format=pdf&month=${month + 1}&year=${year}`}>
              <Download className="h-4 w-4" />
              PDF
            </a>
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((name, idx) => (
                  <SelectItem key={idx} value={String(idx)}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Spending
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.totalSpending)}</div>
                <p className="text-xs text-muted-foreground">
                  {MONTHS[month]} {year}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  vs Last Month
                </CardTitle>
                {data.vsLastMonthPercentage >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-success" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.vsLastMonthPercentage >= 0 ? "+" : ""}
                  {data.vsLastMonthPercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Math.abs(data.vsLastMonth))} {data.vsLastMonthPercentage >= 0 ? "more" : "less"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  vs Same Month Last Year
                </CardTitle>
                {data.vsLastYearPercentage >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-destructive" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-success" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.vsLastYearPercentage >= 0 ? "+" : ""}
                  {data.vsLastYearPercentage.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(Math.abs(data.vsLastYear))} {data.vsLastYearPercentage >= 0 ? "more" : "less"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PieChartIcon className="h-5 w-5 text-muted-foreground" />
                  Category Breakdown
                </CardTitle>
                <CardDescription>Share of spending by category</CardDescription>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="flex h-48 items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data for this period</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <div className="h-56 w-56 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {pieData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2">
                      {pieData.map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span>{entry.name}</span>
                          </div>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(entry.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  Paid By
                </CardTitle>
                <CardDescription>Who paid what this period</CardDescription>
              </CardHeader>
              <CardContent>
                {data.paidByBreakdown.length === 0 ? (
                  <div className="flex h-48 items-center justify-center">
                    <p className="text-sm text-muted-foreground">No payments recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.paidByBreakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <div className="text-right">
                          <span className="text-sm font-medium tabular-nums">
                            {formatCurrency(item.total)}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({item.count} bill{item.count !== 1 && "s"})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
              <CardDescription>All categories with totals and counts</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categoryBreakdown.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        No data for this period
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.categoryBreakdown.map((cat, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }}
                            />
                            <span>{cat.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">
                          {formatCurrency(cat.total)}
                        </TableCell>
                        <TableCell>{cat.count}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${cat.percentage}%` }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {cat.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
