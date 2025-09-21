"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { ArrowRightLeft, ChevronRight, Home, Plus } from "lucide-react"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/dashboard/transfers" className="hover:text-gray-900 transition-colors">
            Stock Transfers
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Create New Transfer</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Stock Transfer</h1>
            <p className="text-gray-600">Transfer inventory between warehouse locations</p>
          </div>
          <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ArrowRightLeft className="w-6 h-6 mr-3 text-blue-600" />
              Transfer Details
            </h2>
          </div>
          <div className="p-8">
            <TransferForm
              warehouses={warehouses}
              onSubmit={handleCreateTransfer}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}