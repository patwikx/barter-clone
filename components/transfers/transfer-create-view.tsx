"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createTransfer, type CreateTransferInput } from "@/lib/actions/transfer-actions"
import { TransferForm } from "./transfer-form"
import { toast } from "sonner"
import Link from "next/link"

interface TransferCreateViewProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

export function TransferCreateView({ warehouses }: TransferCreateViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreateTransfer = (data: CreateTransferInput) => {
    startTransition(async () => {
      const result = await createTransfer(data)

      if (result.success && result.data) {
        toast.success("Transfer created successfully")
        router.push(`/dashboard/transfers/${result.data.id}`)
      } else {
        toast.error(result.error || "Failed to create transfer")
      }
    })
  }

  const handleCancel = () => {
    router.push("/dashboard/transfers")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/transfers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Transfers
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Stock Transfer</h1>
              <p className="text-gray-600">Transfer inventory between warehouse locations</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRightLeft className="w-5 h-5 mr-2" />
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TransferForm
              warehouses={warehouses}
              onSubmit={handleCreateTransfer}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}