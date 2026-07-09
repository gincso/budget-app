import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { inviteCode } = await req.json()
  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 })
  }

  const family = await prisma.family.findUnique({ where: { inviteCode } })
  if (!family) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 })
  }

  const existing = await prisma.familyMember.findUnique({
    where: { userId_familyId: { userId: session.user.id, familyId: family.id } },
  })
  if (existing) {
    return NextResponse.json({ error: "Already a member" }, { status: 409 })
  }

  const member = await prisma.familyMember.create({
    data: {
      userId: session.user.id,
      familyId: family.id,
      role: "MEMBER",
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      family: true,
    },
  })

  return NextResponse.json(member, { status: 201 })
}