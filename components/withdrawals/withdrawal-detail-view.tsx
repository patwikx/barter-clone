"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Package,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  FileText,
  Building,
  Loader2,
  ChevronRight,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cancelWithdrawal, deleteWithdrawal, type WithdrawalWithDetails } from "@/lib/actions/withdrawal-actions"
import { WithdrawalStatus } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface WithdrawalDetailViewProps {
  initialWithdrawal: WithdrawalWithDetails
}

const getStatusIcon = (status: WithdrawalStatus) => {
  switch (status) {
    case WithdrawalStatus.COMPLETED:
      return CheckCircle
    case WithdrawalStatus.CANCELLED:
      return XCircle
    default:
      return CheckCircle
  }
}

const getStatusColor = (status: WithdrawalStatus) => {
  switch (status) {
    case WithdrawalStatus.COMPLETED:
      return "bg-green-100 text-green-800"
    case WithdrawalStatus.CANCELLED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function WithdrawalDetailView({ initialWithdrawal }: WithdrawalDetailViewProps) {
  const router = useRouter()
  const [withdrawal, setWithdrawal] = useState<WithdrawalWithDetails>(initialWithdrawal)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleCancelWithdrawal = () => {
    startTransition(async () => {
      const result = await cancelWithdrawal(withdrawal.id)

      if (result.success && result.data) {
        setWithdrawal(result.data)
        setIsCancelDialogOpen(false)
        toast.success("Withdrawal cancelled successfully")
      } else {
        toast.error(result.error || "Failed to cancel withdrawal")
      }
    })
  }

  const handleDeleteWithdrawal = () => {
    startTransition(async () => {
      const result = await deleteWithdrawal(withdrawal.id)

      if (result.success) {
        toast.success("Withdrawal deleted successfully")
        router.push("/dashboard/withdrawals")
      } else {
        toast.error(result.error || "Failed to delete withdrawal")
      }
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const StatusIcon = getStatusIcon(withdrawal.status)
  const createdByName = [withdrawal.createdBy.firstName, withdrawal.createdBy.lastName]
    .filter(Boolean).join(' ') || withdrawal.createdBy.username

  const totalValue = withdrawal.withdrawalItems.reduce((sum, item) => sum + Number(item.totalValue), 0)

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
          <span className="text-gray-900 font-medium">{withdrawal.withdrawalNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{withdrawal.withdrawalNumber}</h1>
            <p className="text-gray-600">Material Withdrawal Details</p>
          </div>
          <div className="flex items-center gap-3">
            {withdrawal.status === WithdrawalStatus.COMPLETED && (
              <>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Withdrawal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsCancelDialogOpen(true)}
                  disabled={isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Withdrawal
                </Button>
              </>
            )}
            {withdrawal.status === WithdrawalStatus.CANCELLED && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isPending}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Withdrawal
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Withdrawal Items */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Package className="w-6 h-6 mr-3 text-blue-600" />
                  Withdrawal Items ({withdrawal.withdrawalItems.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {withdrawal.withdrawalItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{item.item.itemCode}</div>
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {item.item.description}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              UOM: {item.item.unitOfMeasure}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatNumber(Number(item.quantity))}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(Number(item.unitCost))}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(Number(item.totalValue))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="px-8 py-6 border-t border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Withdrawal Value:</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Withdrawal Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${getStatusColor(withdrawal.status)}`}>
                    <StatusIcon className="w-5 h-5 mr-2" />
                    {withdrawal.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Withdrawal Date</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {withdrawal.withdrawalDate.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {withdrawal.createdAt.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Last Updated</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {withdrawal.updatedAt.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Warehouse Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-600" />
                Warehouse Information
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{withdrawal.warehouse.name}</h4>
                  {withdrawal.warehouse.location && (
                    <p className="text-sm text-gray-600 mt-1">{withdrawal.warehouse.location}</p>
                  )}
                  {withdrawal.warehouse.description && (
                    <p className="text-xs text-gray-500 mt-1">{withdrawal.warehouse.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Withdrawal Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Withdrawal Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Items Count</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(withdrawal.withdrawalItems.length)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Quantity</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(withdrawal.withdrawalItems.reduce((sum, item) => sum + Number(item.quantity), 0))}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total Value</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(totalValue)}</span>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                User Information
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Created By</h4>
                  <p className="text-base font-semibold text-gray-900">{createdByName}</p>
                  <p className="text-sm text-gray-500">@{withdrawal.createdBy.username}</p>
                  {withdrawal.createdBy.position && (
                    <p className="text-xs text-gray-500 mt-1">{withdrawal.createdBy.position}</p>
                  )}
                  {withdrawal.createdBy.department && (
                    <p className="text-xs text-gray-500">{withdrawal.createdBy.department}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Purpose */}
            {withdrawal.purpose && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Purpose</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{withdrawal.purpose}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel withdrawal {withdrawal.withdrawalNumber}? 
              This will reverse the inventory changes and mark the withdrawal as cancelled.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isPending}
            >
              No, Keep Active
            </Button>
            <Button variant="destructive" onClick={handleCancelWithdrawal} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Yes, Cancel Withdrawal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete withdrawal {withdrawal.withdrawalNumber}? 
              This action cannot be undone and will remove all withdrawal records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWithdrawal} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}