"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, ChevronRight, Home } from "lucide-react"
import { createItemEntry, type CreateItemEntryInput } from "@/lib/actions/item-entry-actions"
import { ItemEntryForm } from "./item-entry-form"
import { toast } from "sonner"
import Link from "next/link"

interface ItemEntryCreateViewProps {
  items: Array<{
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    standardCost: number
    supplier: {
      id: string
      name: string
    }
  }>
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
}

export function ItemEntryCreateView({ items, warehouses, suppliers }: ItemEntryCreateViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleCreateEntry = (data: CreateItemEntryInput) => {
    startTransition(async () => {
      const result = await createItemEntry(data)

      if (result.success && result.data) {
        toast.success("Item entry created successfully")
        router.push(`/dashboard/item-entries/${result.data.id}`)
      } else {
        toast.error(result.error || "Failed to create item entry")
      }
    })
  }

  const handleCancel = () => {
    router.push("/dashboard/item-entries")
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
          <Link href="/dashboard/item-entries" className="hover:text-gray-900 transition-colors">
            Item Entries
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Create New Entry</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Item Entry</h1>
            <p className="text-gray-600">Record new inventory items received at warehouse</p>
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Plus className="w-6 h-6 mr-3 text-blue-600" />
              Entry Details
            </h2>
          </div>
          <div className="p-8">
            <ItemEntryForm
              items={items}
              warehouses={warehouses}
              suppliers={suppliers}
              onSubmit={handleCreateEntry}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}