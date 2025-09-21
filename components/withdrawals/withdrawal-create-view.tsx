"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createWithdrawal, type CreateWithdrawalInput } from "@/lib/actions/withdrawal-actions"
import { WithdrawalForm } from "./withdrawal-form"
import { toast } from "sonner"
import Link from "next/link"

interface WithdrawalCreateViewProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

export function WithdrawalCreateView({ warehouses }: WithdrawalCreateViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreateWithdrawal = (data: CreateWithdrawalInput) => {
    startTransition(async () => {
      const result = await createWithdrawal(data)

      if (result.success && result.data) {
        toast.success("Withdrawal request created successfully")
        router.push(`/dashboard/withdrawals/${result.data.id}`)
      } else {
        toast.error(result.error || "Failed to create withdrawal request")
      }
    })
  }

  const handleCancel = () => {
    router.push("/dashboard/withdrawals")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/withdrawals">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Withdrawals
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Withdrawal Request</h1>
              <p className="text-gray-600">Request materials for production or other purposes</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Withdrawal Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WithdrawalForm
              warehouses={warehouses}
              onSubmit={handleCreateWithdrawal}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}