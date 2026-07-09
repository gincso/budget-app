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

  const orConditions: Array<Record<string, unknown>> = [
    { userId: session.user.id },
    { isDefault: true },
  ]
  if (familyId) {
    orConditions.push({ familyId })
  }
  const where = { OR: orConditions }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: "asc" },
  })

  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const category = await prisma.category.create({
    data: {
      name: body.name,
      color: body.color,
      icon: body.icon,
      type: body.type,
      budget: body.budget,
      userId: session.user.id,
      familyId: body.familyId,
    },
  })

  return NextResponse.json(category, { status: 201 })
}