"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export type CalendarProps = {
  mode?: "single" | "range"
  selected?: Date | [Date, Date] | undefined
  onSelect?: (date: Date | [Date, Date] | undefined) => void
  initialMonth?: Date
  className?: string
  disabled?: (date: Date) => boolean
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  initialMonth,
  className,
  disabled,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    initialMonth ?? new Date()
  )

  const selectedDate =
    selected instanceof Date
      ? selected
      : Array.isArray(selected)
        ? selected[0]
        : undefined

  const selectedEnd =
    Array.isArray(selected) ? selected[1] : undefined

  const startDate = startOfWeek(startOfMonth(currentMonth))
  const endDate = endOfWeek(endOfMonth(currentMonth))

  const weeks: Date[][] = []
  let day = startDate
  while (day <= endDate) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(day)
      day = addDays(day, 1)
    }
    weeks.push(week)
  }

  const isInRange = (date: Date) => {
    if (!selectedDate || !selectedEnd) return false
    if (mode !== "range") return false
    return date > selectedDate && date < selectedEnd
  }

  const handleDayClick = (date: Date) => {
    if (disabled?.(date)) return

    if (mode === "single") {
      if (selectedDate && isSameDay(date, selectedDate)) {
        onSelect?.(undefined)
      } else {
        onSelect?.(date)
      }
    } else if (mode === "range") {
      if (!selectedDate || (selectedDate && selectedEnd)) {
        onSelect?.([date, date] as [Date, Date])
      } else {
        const start = date < selectedDate ? date : selectedDate
        const end = date < selectedDate ? selectedDate : date
        onSelect?.([start, end] as [Date, Date])
      }
    }
  }

  const header = format(currentMonth, "MMMM yyyy")

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between px-1 pb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <div className="text-sm font-medium">{header}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0 text-center text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 text-muted-foreground font-medium">
            {d}
          </div>
        ))}
        {weeks.map((week, i) => (
          <React.Fragment key={i}>
            {week.map((date) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate)
              const isSelectedEnd = selectedEnd && isSameDay(date, selectedEnd)
              const inRange = isInRange(date)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isDisabled = disabled?.(date)
              const today = isToday(date)

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDayClick(date)}
                  className={cn(
                    "relative h-8 w-full rounded-md text-sm p-0 focus:outline-none focus:ring-1 focus:ring-ring",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isDisabled && "opacity-50 cursor-not-allowed",
                    isSelected &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    inRange && "bg-accent text-accent-foreground",
                    isSelectedEnd &&
                      "bg-primary text-primary-foreground",
                    !isSelected &&
                      !isSelectedEnd &&
                      !inRange &&
                      isCurrentMonth &&
                      !isDisabled &&
                      "hover:bg-accent hover:text-accent-foreground",
                    today && !isSelected && !isSelectedEnd && "ring-1 ring-ring"
                  )}
                >
                  <time dateTime={format(date, "yyyy-MM-dd")}>
                    {format(date, "d")}
                  </time>
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
