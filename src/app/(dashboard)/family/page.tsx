"use client"

import { useEffect, useState, useCallback } from "react"
import {
  Users,
  Plus,
  Copy,
  Check,
  UserPlus,
  LogIn,
  Shield,
  ShieldCheck,
  User,
  Loader2,
  AlertCircle,
  X,
  Mail,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/toast"
import type { Family, FamilyMember } from "@/types"
import { FamilyRole } from "@/types"

type FamilyWithMembers = Family & { members: (FamilyMember & { user: { id: string; name: string | null; email: string } })[] }

const ROLE_HIERARCHY: Record<FamilyRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
}

const ROLE_VARIANTS: Record<FamilyRole, "default" | "secondary" | "outline"> = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
}

export default function FamilyPage() {
  const [families, setFamilies] = useState<FamilyWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [createName, setCreateName] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  const fetchFamilies = useCallback(async () => {
    try {
      const res = await fetch("/api/family")
      if (!res.ok) throw new Error("Failed to fetch families")
      const data = await res.json()
      setFamilies(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFamilies() }, [fetchFamilies])

  const handleCreate = async () => {
    if (!createName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName }),
      })
      if (!res.ok) throw new Error("Failed to create family")
      await fetchFamilies()
      setCreateOpen(false)
      setCreateName("")
      toast.success("Family created")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create family")
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async () => {
    if (!inviteCode.trim()) return
    setJoining(true)
    try {
      const res = await fetch("/api/family/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })
      if (!res.ok) throw new Error("Invalid invite code")
      await fetchFamilies()
      setJoinOpen(false)
      setInviteCode("")
      toast.success("Joined family")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to join family")
    } finally {
      setJoining(false)
    }
  }

  const handleCopyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
      toast.success("Invite code copied")
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleRemoveMember = async (familyId: string, memberId: string) => {
    try {
      const res = await fetch(`/api/family/${familyId}/members/${memberId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove member")
      await fetchFamilies()
      toast.success("Member removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member")
    }
  }

  const handleRoleChange = async (familyId: string, memberId: string, role: FamilyRole) => {
    try {
      const res = await fetch(`/api/family/${familyId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error("Failed to update role")
      await fetchFamilies()
      toast.success("Role updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role")
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium text-destructive">Failed to load families</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your families and members
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LogIn className="h-4 w-4" />
                Join Family
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join a Family</DialogTitle>
                <DialogDescription>Enter an invite code to join an existing family.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    placeholder="Enter invite code..."
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setJoinOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleJoin} disabled={joining || !inviteCode.trim()}>
                  {joining ? "Joining..." : "Join"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" />
                Create Family
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Family</DialogTitle>
                <DialogDescription>Create a new family to share bills and budgets.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="family-name">Family Name</Label>
                  <Input
                    id="family-name"
                    placeholder="Enter family name..."
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={creating || !createName.trim()}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {families.length === 0 ? (
        <Card>
          <CardContent className="flex h-40 flex-col items-center justify-center gap-2">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No families yet</p>
            <p className="text-xs text-muted-foreground">Create or join a family to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {families.map((family) => {
            const owner = family.members.find((m) => m.role === FamilyRole.OWNER)
            return (
              <Card key={family.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        {family.name}
                      </CardTitle>
                      <CardDescription>
                        {family.members.length} member{family.members.length !== 1 && "s"}
                        {owner && ` · Created by ${owner.user.name || owner.user.email}`}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {family.inviteCode && (
                    <div className="rounded-lg border bg-muted/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Invite Members</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 rounded border bg-background px-3 py-2 text-sm font-mono">
                          {family.inviteCode}
                        </code>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(family.inviteCode!, family.id)}
                        >
                          {copiedId === family.id ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-3 text-sm font-medium text-muted-foreground">Members</h3>
                    <div className="space-y-2">
                      {family.members.map((member) => {
                        const isOwner = member.role === FamilyRole.OWNER
                        const memberName = member.user.name || "Unnamed"
                        const memberEmail = member.user.email
                        return (
                          <div
                            key={member.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                                {isOwner ? (
                                  <ShieldCheck className="h-4 w-4 text-primary" />
                                ) : (
                                  <User className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{memberName}</p>
                                <p className="text-xs text-muted-foreground">{memberEmail}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={ROLE_VARIANTS[member.role]}>
                                {member.role}
                              </Badge>
                              {owner && owner.userId === "current-user" && !isOwner && (
                                <>
                                  <Select
                                    value={member.role}
                                    onValueChange={(v: FamilyRole) =>
                                      handleRoleChange(family.id, member.id, v)
                                    }
                                  >
                                    <SelectTrigger className="h-8 w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value={FamilyRole.ADMIN}>Admin</SelectItem>
                                      <SelectItem value={FamilyRole.MEMBER}>Member</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleRemoveMember(family.id, member.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
