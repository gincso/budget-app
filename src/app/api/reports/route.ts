import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const familyId = searchParams.get("familyId")
  const month = searchParams.get("month")
  const year = searchParams.get("year")

  const now = new Date()
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) - 1 : now.getMonth()

  const period = month ? "monthly" : "yearly"
  const dateStart = month ? startOfMonth(new Date(targetYear, targetMonth)) : startOfYear(new Date(targetYear, 0))
  const dateEnd = month ? endOfMonth(new Date(targetYear, targetMonth)) : endOfYear(new Date(targetYear, 0))

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
  })

  const totalBills = bills.length
  const totalPaid = bills.filter((b) => b.status === "PAID").length
  const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)
  const paidAmount = bills.filter((b) => b.status === "PAID").reduce((sum, b) => sum + b.amount, 0)
  const pendingAmount = bills.filter((b) => b.status === "PENDING").reduce((sum, b) => sum + b.amount, 0)

  const categoryBreakdown: Record<string, { name: string; color: string; count: number; total: number }> = {}
  for (const bill of bills) {
    const key = bill.categoryId
    if (!categoryBreakdown[key]) {
      categoryBreakdown[key] = { name: bill.category.name, color: bill.category.color, count: 0, total: 0 }
    }
    categoryBreakdown[key].count++
    categoryBreakdown[key].total += bill.amount
  }

  const loanWhere: Record<string, unknown> = {}
  if (familyId) {
    loanWhere.familyId = familyId
  } else {
    loanWhere.OR = [
      { userId: session.user.id },
      { family: { members: { some: { userId: session.user.id } } } },
    ]
  }

  const loans = await prisma.loan.findMany({ where: loanWhere })
  const totalLoanBalance = loans.reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0)

  return NextResponse.json({
    period: { type: period, month: targetMonth + 1, year: targetYear },
    bills: {
      total: totalBills,
      paid: totalPaid,
      pending: totalBills - totalPaid,
      totalAmount,
      paidAmount,
      pendingAmount,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([id, data]) => ({ id, ...data })),
    },
    loans: {
      total: loans.length,
      active: loans.filter((l) => l.status === "ACTIVE").length,
      totalBalance: totalLoanBalance,
      totalOwed: loans.reduce((sum, l) => sum + l.totalAmount, 0),
    },
  })
}