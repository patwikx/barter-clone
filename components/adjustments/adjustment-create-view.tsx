"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createInventoryAdjustment, type CreateAdjustmentInput } from "@/lib/actions/adjustments-actions"
import { AdjustmentForm } from "./adjustment-form"
import { toast } from "sonner"
import Link from "next/link"

interface AdjustmentCreateViewProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

export function AdjustmentCreateView({ warehouses }: AdjustmentCreateViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreateAdjustment = (data: CreateAdjustmentInput) => {
    startTransition(async () => {
      const result = await createInventoryAdjustment(data)

      if (result.success && result.data) {
        toast.success("Inventory adjustment created successfully")
        router.push(`/dashboard/adjustments/${result.data.id}`)
      } else {
        toast.error(result.error || "Failed to create inventory adjustment")
      }
    })
  }

  const handleCancel = () => {
    router.push("/dashboard/adjustments")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/adjustments">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Adjustments
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Inventory Adjustment</h1>
              <p className="text-gray-600">Adjust inventory quantities based on physical counts or corrections</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Adjustment Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AdjustmentForm
              warehouses={warehouses}
              onSubmit={handleCreateAdjustment}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}