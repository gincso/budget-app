import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface LLMMessage {
  role: string;
  content: string;
}

async function getOpenAIResponse(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: LLMMessage[]
): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

async function getAnthropicResponse(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: LLMMessage[]
): Promise<string> {
  const anthropic = new Anthropic({ apiKey });
  const response = await anthropic.messages.create({
    model,
    system: systemPrompt,
    messages: messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    max_tokens: 4096,
  });
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { text: string }).text)
    .join("");
}

async function getGoogleResponse(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: LLMMessage[]
): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model, systemInstruction: systemPrompt });
  const chat = genModel.startChat({
    history: messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  });
  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessage(lastMessage.content);
  return result.response.text();
}

async function getOllamaResponse(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: LLMMessage[]
): Promise<string> {
  const baseUrl = apiKey || "http://localhost:11434";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      stream: false,
    }),
  });
  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.statusText}`);
  }
  const data = await response.json();
  return data.message?.content ?? "";
}

export async function getLLMResponse(
  provider: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: LLMMessage[]
): Promise<string> {
  try {
    switch (provider) {
      case "openai":
        return getOpenAIResponse(apiKey, model, systemPrompt, messages);
      case "anthropic":
        return getAnthropicResponse(apiKey, model, systemPrompt, messages);
      case "google":
        return getGoogleResponse(apiKey, model, systemPrompt, messages);
      case "ollama":
        return getOllamaResponse(apiKey, model, systemPrompt, messages);
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  } catch (error) {
    throw new Error(
      `LLM request failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
