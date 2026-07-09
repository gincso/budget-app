"use client"

import { useState } from "react"
import { Check, X, Inbox, SendHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"

type Request = {
  id: string
  billName: string
  amount: number
  requesterName: string
  message: string | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string
}

export default function RequestsPage() {
  const [pendingRequests] = useState<Request[]>([])
  const [myRequests] = useState<Request[]>([])

  const STATUS_VARIANT: Record<string, "default" | "success" | "destructive" | "secondary" | "warning"> = {
    PENDING: "default",
    APPROVED: "success",
    REJECTED: "destructive",
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bill Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and manage bill payment requests</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="font-medium">{req.billName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(req.amount)} &middot; by {req.requesterName}
                      </p>
                      {req.message && (
                        <p className="mt-1 text-sm text-muted-foreground italic">&ldquo;{req.message}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="text-green-600">
                        <Check className="h-4 w-4" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <X className="h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Inbox className="h-16 w-16 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No pending requests</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                When family members request to pay or override a bill, their requests will appear here for your review.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-requests" className="mt-6">
          {myRequests.length > 0 ? (
            <div className="space-y-4">
              {myRequests.map((req) => (
                <Card key={req.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div>
                      <p className="font-medium">{req.billName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(req.amount)} &middot; {formatDate(req.createdAt)}
                      </p>
                      {req.message && (
                        <p className="mt-1 text-sm text-muted-foreground italic">&ldquo;{req.message}&rdquo;</p>
                      )}
                    </div>
                    <Badge variant={STATUS_VARIANT[req.status]}>{req.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <SendHorizontal className="h-16 w-16 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No requests yet</h3>
              <p className="mt-2 text-sm text-muted-foreground max-w-md">
                You haven&apos;t made any bill requests. Request to pay or override a bill from the bill details page.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
