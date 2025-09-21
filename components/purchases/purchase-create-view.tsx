"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, ChevronRight, Home, Plus } from "lucide-react"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/dashboard/purchases" className="hover:text-gray-900 transition-colors">
            Purchase Orders
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Create New Order</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Purchase Order</h1>
            <p className="text-gray-600">Create a new purchase order for inventory replenishment</p>
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-3 text-blue-600" />
              Purchase Order Details
            </h2>
          </div>
          <div className="p-8">
            <PurchaseForm
              suppliers={suppliers}
              items={items}
              onSubmit={handleCreatePurchase}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}