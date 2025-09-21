"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightLeft,
  User,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Edit,
  Trash2,
  FileText,
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
import { approveTransfer, deleteTransfer, type TransferWithDetails } from "@/lib/actions/transfer-actions"
import { TransferStatus } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface TransferDetailViewProps {
  initialTransfer: TransferWithDetails
}

const getStatusIcon = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.PENDING:
      return Clock
    case TransferStatus.IN_TRANSIT:
      return Truck
    case TransferStatus.COMPLETED:
      return CheckCircle
    case TransferStatus.CANCELLED:
      return XCircle
    default:
      return Clock
  }
}

const getStatusColor = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case TransferStatus.IN_TRANSIT:
      return "bg-blue-100 text-blue-800"
    case TransferStatus.COMPLETED:
      return "bg-green-100 text-green-800"
    case TransferStatus.CANCELLED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function TransferDetailView({ initialTransfer }: TransferDetailViewProps) {
  const router = useRouter()
  const [transfer, setTransfer] = useState<TransferWithDetails>(initialTransfer)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleApproveTransfer = () => {
    startTransition(async () => {
      const result = await approveTransfer(transfer.id)

      if (result.success && result.data) {
        setTransfer(result.data)
        setIsApproveDialogOpen(false)
        toast.success("Transfer approved and executed successfully")
      } else {
        toast.error(result.error || "Failed to approve transfer")
      }
    })
  }

  const handleDeleteTransfer = () => {
    startTransition(async () => {
      const result = await deleteTransfer(transfer.id)

      if (result.success) {
        toast.success("Transfer deleted successfully")
        router.push("/dashboard/transfers")
      } else {
        toast.error(result.error || "Failed to delete transfer")
      }
    })
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const StatusIcon = getStatusIcon(transfer.status)
  const createdByName = [transfer.createdBy.firstName, transfer.createdBy.lastName]
    .filter(Boolean).join(' ') || transfer.createdBy.username
  const approvedByName = transfer.approvedBy 
    ? [transfer.approvedBy.firstName, transfer.approvedBy.lastName]
        .filter(Boolean).join(' ') || transfer.approvedBy.username
    : null

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
          <span className="text-gray-900 font-medium">{transfer.transferNumber}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{transfer.transferNumber}</h1>
            <p className="text-gray-600">Stock Transfer Details</p>
          </div>
          <div className="flex items-center gap-3">
            {transfer.status === TransferStatus.PENDING && (
              <>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Transfer
                </Button>
                <Button onClick={() => setIsApproveDialogOpen(true)} disabled={isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Transfer
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Transfer
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Transfer Items */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Package className="w-6 h-6 mr-3 text-blue-600" />
                  Transfer Items ({transfer.transferItems.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transfer.transferItems.map((item) => (
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
                            {formatNumber(item.quantity)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="px-8 py-6 border-t border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Items:</span>
                    <span className="text-2xl font-bold text-gray-900">{formatNumber(transfer.transferItems.length)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${getStatusColor(transfer.status)}`}>
                    <StatusIcon className="w-5 h-5 mr-2" />
                    {transfer.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Transfer Date</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {transfer.transferDate.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {transfer.createdAt.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {transfer.approvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Approved</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {transfer.approvedAt.toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Warehouse Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ArrowRightLeft className="w-5 h-5 mr-2 text-gray-600" />
                Transfer Route
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">From Warehouse</h4>
                  <p className="text-base font-semibold text-gray-900">{transfer.fromWarehouse.name}</p>
                  {transfer.fromWarehouse.location && (
                    <p className="text-sm text-gray-500">{transfer.fromWarehouse.location}</p>
                  )}
                </div>
                
                <div className="flex justify-center py-2">
                  <ArrowRightLeft className="w-6 h-6 text-blue-500" />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-600 mb-1">To Warehouse</h4>
                  <p className="text-base font-semibold text-gray-900">{transfer.toWarehouse.name}</p>
                  {transfer.toWarehouse.location && (
                    <p className="text-sm text-gray-500">{transfer.toWarehouse.location}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Transfer Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Transfer Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Items Count</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(transfer.transferItems.length)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Quantity</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(transfer.transferItems.reduce((sum, item) => sum + item.quantity, 0))}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total Items</span>
                  <span className="text-xl font-bold text-gray-900">{formatNumber(transfer.transferItems.length)}</span>
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
                  <p className="text-sm text-gray-500">@{transfer.createdBy.username}</p>
                </div>
                
                {approvedByName && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Approved By</h4>
                      <p className="text-base font-semibold text-gray-900">{approvedByName}</p>
                      <p className="text-sm text-gray-500">@{transfer.approvedBy?.username}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            {transfer.notes && (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{transfer.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Transfer</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve transfer {transfer.transferNumber}? 
              This will execute the transfer and update inventory levels in both warehouses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApproveDialogOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleApproveTransfer} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Transfer
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
            <DialogTitle>Delete Transfer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete transfer {transfer.transferNumber}? 
              This action cannot be undone.
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
            <Button variant="destructive" onClick={handleDeleteTransfer} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Transfer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}