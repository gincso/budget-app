import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const config = await prisma.llmConfig.findUnique({
    where: { userId: session.user.id },
    select: { provider: true, model: true },
  })

  return NextResponse.json(config ?? { provider: "openai", model: "gpt-4o" })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const config = await prisma.llmConfig.upsert({
    where: { userId: session.user.id },
    update: {
      provider: body.provider,
      apiKey: body.apiKey,
      model: body.model,
    },
    create: {
      userId: session.user.id,
      provider: body.provider ?? "openai",
      apiKey: body.apiKey,
      model: body.model ?? "gpt-4o",
    },
    select: { provider: true, model: true },
  })

  return NextResponse.json(config)
}