"use client"

import React, { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Truck, ChevronRight, Home } from "lucide-react"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/dashboard" className="flex items-center hover:text-gray-900 transition-colors">
            <Home className="w-4 h-4" />
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/dashboard/withdrawals" className="hover:text-gray-900 transition-colors">
            Material Withdrawals
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Create Withdrawal Request</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Withdrawal Request</h1>
            <p className="text-gray-600">Request materials for production or other purposes</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Truck className="w-6 h-6 mr-3 text-blue-600" />
              Withdrawal Details
            </h2>
          </div>
          <div className="p-8">
            <WithdrawalForm
              warehouses={warehouses}
              onSubmit={handleCreateWithdrawal}
              onCancel={handleCancel}
              isLoading={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  )
}