import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const familyId = searchParams.get("familyId")

  const where: Record<string, unknown> = {}
  if (familyId) {
    where.familyId = familyId
  } else {
    where.OR = [
      { userId: session.user.id },
      { family: { members: { some: { userId: session.user.id } } } },
    ]
  }

  const loans = await prisma.loan.findMany({
    where,
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(loans)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const loan = await prisma.loan.create({
    data: {
      name: body.name,
      totalAmount: body.totalAmount,
      paidAmount: body.paidAmount ?? 0,
      interestRate: body.interestRate,
      monthlyPayment: body.monthlyPayment,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      type: body.type,
      lender: body.lender,
      notes: body.notes,
      familyId: body.familyId,
      userId: session.user.id,
      status: body.status ?? "ACTIVE",
    },
  })

  return NextResponse.json(loan, { status: 201 })
}