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

  const templates = await prisma.template.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(templates)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const template = await prisma.template.create({
    data: {
      name: body.name,
      amount: body.amount,
      categoryId: body.categoryId,
      interval: body.interval,
      isVariable: body.isVariable ?? false,
      notes: body.notes,
      active: body.active ?? true,
      familyId: body.familyId || null,
      userId: session.user.id,
    },
    include: { category: true },
  })

  return NextResponse.json(template, { status: 201 })
}