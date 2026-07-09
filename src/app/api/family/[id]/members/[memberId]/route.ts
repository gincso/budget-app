import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, memberId } = await params
  const currentMember = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: session.user.id, familyId: id } },
  })
  if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const member = await prisma.familyMember.update({
    where: { id: memberId },
    data: { role: body.role },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  })

  return NextResponse.json(member)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id, memberId } = await params
  const currentMember = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: session.user.id, familyId: id } },
  })
  if (!currentMember || (currentMember.role !== "OWNER" && currentMember.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const target = await prisma.familyMember.findUnique({ where: { id: memberId } })
  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 })
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 })
  }

  await prisma.familyMember.delete({ where: { id: memberId } })
  return NextResponse.json({ success: true })
}