"use client"

import { useEffect, useState, useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns"
import { ChevronLeft, ChevronRight, Circle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatCurrency, getCategoryColor } from "@/lib/utils"
import { Loader2, AlertCircle } from "lucide-react"
import type { Bill, Category } from "@/types"

type BillWithCategory = Bill & { category: Category }

export default function CalendarPage() {
  const [bills, setBills] = useState<BillWithCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calStart = startOfWeek(monthStart)
    const calEnd = endOfWeek(monthEnd)
    return eachDayOfInterval({ start: calStart, end: calEnd })
  }, [currentDate])

  const billsByDate = useMemo(() => {
    const map = new Map<string, BillWithCategory[]>()
    bills.forEach((bill) => {
      const dateKey = typeof bill.dueDate === "string"
        ? bill.dueDate.split("T")[0]
        : format(new Date(bill.dueDate), "yyyy-MM-dd")
      if (!map.has(dateKey)) map.set(dateKey, [])
      map.get(dateKey)!.push(bill)
    })
    return map
  }, [bills])

  const selectedBills = selectedDate
    ? billsByDate.get(format(selectedDate, "yyyy-MM-dd")) || []
    : []

  const categoryColors = useMemo(() => {
    const colors = new Map<string, string>()
    bills.forEach((bill) => {
      if (!colors.has(bill.category.name)) {
        colors.set(bill.category.name, bill.category.color || getCategoryColor(bill.category.name))
      }
    })
    return colors
  }, [bills])

  function prevMonth() { setCurrentDate((d) => subMonths(d, 1)) }
  function nextMonth() { setCurrentDate((d) => addMonths(d, 1)) }
  function goToday() { setCurrentDate(new Date()) }

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
        <p className="text-lg font-medium text-destructive">Failed to load calendar</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const today = new Date()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your bills by due date
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-40 text-center text-lg font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={goToday}>
          Today
        </Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="grid grid-cols-7 gap-px">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd")
              const dayBills = billsByDate.get(dateKey) || []
              const isCurrentMonth = isSameMonth(day, currentDate)
              const isToday = isSameDay(day, today)
              const isSelected = selectedDate && isSameDay(day, selectedDate)

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex min-h-24 flex-col gap-0.5 rounded-md p-1.5 text-left transition-colors hover:bg-accent",
                    !isCurrentMonth && "opacity-40",
                    isSelected && "bg-accent ring-1 ring-ring",
                    isToday && "border border-primary"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium",
                      isToday && "text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    {dayBills.slice(0, 3).map((bill) => (
                      <span
                        key={bill.id}
                        className="truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight"
                        style={{
                          backgroundColor: `${bill.category.color || getCategoryColor(bill.category.name)}20`,
                          color: bill.category.color || getCategoryColor(bill.category.name),
                        }}
                      >
                        {formatCurrency(bill.amount)}
                      </span>
                    ))}
                    {dayBills.length > 3 && (
                      <span className="px-1 text-[10px] text-muted-foreground">
                        +{dayBills.length - 3} more
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Bills Due on {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedBills.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bills due on this date.</p>
            ) : (
              <div className="divide-y">
                {selectedBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: bill.category.color || getCategoryColor(bill.category.name) }}
                      />
                      <div>
                        <p className="text-sm font-medium">{bill.name}</p>
                        <p className="text-xs text-muted-foreground">{bill.category.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(bill.amount)}
                      </span>
                      <Badge variant={bill.status === "PAID" ? "success" : bill.status === "OVERRIDE" ? "warning" : bill.status === "CANCELLED" ? "destructive" : "default"}>
                        {bill.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Category Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Array.from(categoryColors.entries()).map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5 text-sm">
                <Circle className="h-3 w-3" style={{ fill: color, color: color }} />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}