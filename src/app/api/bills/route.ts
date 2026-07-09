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

  const bills = await prisma.bill.findMany({
    where,
    include: { category: true, payer: true, requests: true },
    orderBy: { dueDate: "asc" },
  })

  return NextResponse.json(bills)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const bill = await prisma.bill.create({
    data: {
      name: body.name,
      amount: body.amount,
      categoryId: body.categoryId,
      dueDate: new Date(body.dueDate),
      status: body.status ?? "PENDING",
      notes: body.notes,
      isRecurring: body.isRecurring ?? false,
      recurringInterval: body.recurringInterval,
      recurringEndDate: body.recurringEndDate ? new Date(body.recurringEndDate) : undefined,
      isVariable: body.isVariable ?? false,
      familyId: body.familyId || null,
      userId: session.user.id,
    },
    include: { category: true },
  })

  return NextResponse.json(bill, { status: 201 })
}