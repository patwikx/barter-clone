"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createPurchase, type CreatePurchaseInput } from "@/lib/actions/purchase-actions"
import { PurchaseForm } from "./purchase-form"
import { toast } from "sonner"
import Link from "next/link"

interface PurchaseCreateViewProps {
  suppliers: Array<{ id: string; name: string }>
  items: Array<{
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    standardCost: number
  }>
}

export function PurchaseCreateView({ suppliers, items }: PurchaseCreateViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreatePurchase = (data: CreatePurchaseInput) => {
    startTransition(async () => {
      const result = await createPurchase(data)

      if (result.success && result.data) {
        toast.success("Purchase order created successfully")
        router.push(`/dashboard/purchases/${result.data.id}`)
      } else {
        toast.error(result.error || "Failed to create purchase order")
      }
    })
  }

  const handleCancel = () => {
    router.push("/dashboard/purchases")
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/purchases">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Purchases
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
              <p className="text-gray-600">Create a new purchase order for inventory replenishment</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Purchase Order Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PurchaseForm
              suppliers={suppliers}
              items={items}
              onSubmit={handleCreatePurchase}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}