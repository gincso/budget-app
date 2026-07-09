import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getLLMResponse } from "@/lib/llm"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const llmConfig = await prisma.llmConfig.findUnique({
    where: { userId: session.user.id },
  })
  if (!llmConfig) {
    return NextResponse.json({ error: "LLM not configured" }, { status: 400 })
  }

  const body = await req.json()
  const { messages } = body as { messages: { role: string; content: string }[] }

  const [bills, loans] = await Promise.all([
    prisma.bill.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { family: { members: { some: { userId: session.user.id } } } },
        ],
      },
      include: { category: true },
      take: 50,
      orderBy: { dueDate: "asc" },
    }),
    prisma.loan.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { family: { members: { some: { userId: session.user.id } } } },
        ],
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    }),
  ])

  const systemPrompt = `You are a helpful budgeting assistant. You have access to the user's financial data.

Current bills:
${JSON.stringify(bills, null, 2)}

Current loans:
${JSON.stringify(loans, null, 2)}

Provide helpful budgeting advice, answer questions about their finances, and help them manage their money. Be concise and practical.`

  try {
    const response = await getLLMResponse(
      llmConfig.provider,
      llmConfig.apiKey,
      llmConfig.model,
      systemPrompt,
      messages
    )
    return NextResponse.json({ response })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "LLM request failed" },
      { status: 500 }
    )
  }
}