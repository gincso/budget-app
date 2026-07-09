import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const family = await prisma.family.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
      categories: true,
      _count: { select: { members: true, bills: true, loans: true } },
    },
  })

  if (!family) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isMember = family.members.some((m) => m.userId === userId)
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(family)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const member = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: session.user.id, familyId: id } },
  })
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const family = await prisma.family.update({
    where: { id },
    data: { name: body.name, inviteCode: body.inviteCode },
  })

  return NextResponse.json(family)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const member = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: session.user.id, familyId: id } },
  })
  if (!member || member.role !== "OWNER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.family.delete({ where: { id } })
  return NextResponse.json({ success: true })
}