"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useTheme } from "next-themes"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const PROVIDER_MODELS: Record<string, string[]> = {
  OpenAI: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
  Anthropic: ["claude-3-5-sonnet", "claude-3-haiku"],
  Google: ["gemini-1.5-pro", "gemini-1.5-flash"],
  Ollama: ["llama3", "mistral"],
}

const DEFAULT_MODELS: Record<string, string> = {
  OpenAI: "gpt-4o",
  Anthropic: "claude-3-5-sonnet",
  Google: "gemini-1.5-pro",
  Ollama: "llama3",
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()

  const [provider, setProvider] = useState("OpenAI")
  const [model, setModel] = useState("gpt-4o")
  const [apiKey, setApiKey] = useState("")
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch("/api/llm/config").then((r) => {
      if (r.ok) return r.json()
      throw new Error("No config")
    }).then((config) => {
      if (config) {
        setProvider(config.provider || "OpenAI")
        setModel(config.model || DEFAULT_MODELS[config.provider] || "gpt-4o")
        setApiKey(config.apiKey || "")
      }
    }).catch(() => {}).finally(() => setLoaded(true))
  }, [])

  function handleProviderChange(p: string) {
    setProvider(p)
    setModel(DEFAULT_MODELS[p] || "")
  }

  async function handleTestConnection() {
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          model,
          apiKey,
          messages: [{ role: "user", content: "Test connection - respond with OK" }],
        }),
      })
      if (res.ok) setTestResult("success")
      else setTestResult("error")
    } catch {
      setTestResult("error")
    } finally {
      setTestLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch("/api/llm/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, model, apiKey }),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="llm">LLM Provider</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={session?.user?.email ?? ""} readOnly />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input value={session?.user?.name ?? ""} readOnly />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Theme</Label>
                <div className="flex gap-4">
                  {["light", "dark", "system"].map((t) => (
                    <label
                      key={t}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border p-4 has-[:checked]:border-primary"
                    >
                      <input
                        type="radio"
                        name="theme"
                        value={t}
                        checked={theme === t}
                        onChange={() => setTheme(t)}
                        className="accent-primary"
                      />
                      <span className="text-sm font-medium capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="llm">
          <Card>
            <CardHeader>
              <CardTitle>LLM Provider</CardTitle>
              <CardDescription>Configure AI provider for budget insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!loaded ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select value={provider} onValueChange={handleProviderChange}>
                      <SelectTrigger id="provider" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OpenAI">OpenAI</SelectItem>
                        <SelectItem value="Anthropic">Anthropic</SelectItem>
                        <SelectItem value="Google">Google</SelectItem>
                        <SelectItem value="Ollama">Ollama</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} placeholder={DEFAULT_MODELS[provider] || "Enter model name"} />
                    <div className="flex flex-wrap gap-2 pt-1">
                      {(PROVIDER_MODELS[provider] || []).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setModel(m)}
                          className="rounded-md border bg-muted px-2.5 py-1 text-xs font-medium hover:bg-accent"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiKey">
                      {provider === "Ollama" ? "Base URL" : "API Key"}
                    </Label>
                    <Input id="apiKey" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={provider === "Ollama" ? "http://localhost:11434" : "sk-..."} />
                  </div>

                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleTestConnection} disabled={testLoading}>
                      {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Test Connection
                    </Button>
                    {testResult === "success" && (
                      <Badge variant="success" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    )}
                    {testResult === "error" && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" /> Failed
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
              <CardDescription>BudgetApp - Family Finance Manager</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-medium">v0.1.0</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="text-sm">Manage your family budget, bills, and finances.</p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Next.js</Badge>
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">Prisma</Badge>
                  <Badge variant="secondary">Tailwind CSS</Badge>
                  <Badge variant="secondary">NextAuth.js</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
