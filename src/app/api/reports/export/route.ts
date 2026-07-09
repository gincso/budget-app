import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import Papa from "papaparse"
import { startOfMonth, endOfMonth } from "date-fns"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") ?? "csv"
  const familyId = searchParams.get("familyId")
  const month = searchParams.get("month")
  const year = searchParams.get("year")

  const now = new Date()
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth()
  const dateStart = startOfMonth(new Date(targetYear, targetMonth))
  const dateEnd = endOfMonth(new Date(targetYear, targetMonth))

  const billWhere: Record<string, unknown> = {
    dueDate: { gte: dateStart, lte: dateEnd },
  }
  if (familyId) {
    billWhere.familyId = familyId
  } else {
    billWhere.OR = [
      { userId: session.user.id },
      { family: { members: { some: { userId: session.user.id } } } },
    ]
  }

  const bills = await prisma.bill.findMany({
    where: billWhere,
    include: { category: true },
    orderBy: { dueDate: "asc" },
  })

  if (format === "csv") {
    const rows = bills.map((b) => ({
      Name: b.name,
      Amount: b.amount,
      Category: b.category.name,
      "Due Date": b.dueDate.toISOString().split("T")[0],
      Status: b.status,
      "Is Recurring": b.isRecurring ? "Yes" : "No",
      Notes: b.notes ?? "",
    }))

    const csv = Papa.unparse(rows)
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="budget-report-${targetYear}-${String(targetMonth + 1).padStart(2, "0")}.csv"`,
      },
    })
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 })
}