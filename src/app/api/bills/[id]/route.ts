import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { category: true, payer: true, requests: true },
  })

  if (!bill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (bill.userId !== session.user.id && !bill.familyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(bill)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.bill.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const bill = await prisma.bill.update({
    where: { id },
    data: {
      name: body.name,
      amount: body.amount,
      categoryId: body.categoryId,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      status: body.status,
      notes: body.notes,
      isRecurring: body.isRecurring,
      recurringInterval: body.recurringInterval,
      recurringEndDate: body.recurringEndDate ? new Date(body.recurringEndDate) : undefined,
      isVariable: body.isVariable,
      paidBy: body.paidBy,
      paidAt: body.paidAt ? new Date(body.paidAt) : undefined,
    },
    include: { category: true },
  })

  return NextResponse.json(bill)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.bill.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.bill.delete({ where: { id } })
  return NextResponse.json({ success: true })
}