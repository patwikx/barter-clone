"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Package,
  CheckCircle,
  Clock,
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
import { approvePurchase, deletePurchase, type PurchaseWithDetails } from "@/lib/actions/purchase-actions"
import { PurchaseStatus } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface PurchaseDetailViewProps {
  initialPurchase: PurchaseWithDetails
}

const getStatusIcon = (status: PurchaseStatus) => {
  switch (status) {
    case PurchaseStatus.PENDING:
      return Clock
    case PurchaseStatus.RECEIVED:
      return CheckCircle
    case PurchaseStatus.PARTIALLY_RECEIVED:
      return Package
    case PurchaseStatus.CANCELLED:
      return XCircle
    default:
      return Clock
  }
}

const getStatusColor = (status: PurchaseStatus) => {
  switch (status) {
    case PurchaseStatus.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case PurchaseStatus.RECEIVED:
      return "bg-green-100 text-green-800"
    case PurchaseStatus.PARTIALLY_RECEIVED:
      return "bg-blue-100 text-blue-800"
    case PurchaseStatus.CANCELLED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function PurchaseDetailView({ initialPurchase }: PurchaseDetailViewProps) {
  const router = useRouter()
  const [purchase, setPurchase] = useState<PurchaseWithDetails>(initialPurchase)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleApprovePurchase = () => {
    startTransition(async () => {
      const result = await approvePurchase(purchase.id)

      if (result.success && result.data) {
        setPurchase(result.data)
        setIsApproveDialogOpen(false)
        toast.success("Purchase order approved successfully")
      } else {
        toast.error(result.error || "Failed to approve purchase order")
      }
    })
  }

  const handleDeletePurchase = () => {
    startTransition(async () => {
      const result = await deletePurchase(purchase.id)

      if (result.success) {
        toast.success("Purchase order deleted successfully")
        router.push("/dashboard/purchases")
      } else {
        toast.error(result.error || "Failed to delete purchase order")
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

  const StatusIcon = getStatusIcon(purchase.status)
  const createdByName = [purchase.createdBy.firstName, purchase.createdBy.lastName]
    .filter(Boolean).join(' ') || purchase.createdBy.username
  const approvedByName = purchase.approvedBy 
    ? [purchase.approvedBy.firstName, purchase.approvedBy.lastName]
        .filter(Boolean).join(' ') || purchase.approvedBy.username
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
          <Link href="/dashboard/purchases" className="hover:text-gray-900 transition-colors">
            Purchase Orders
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{purchase.purchaseOrder}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{purchase.purchaseOrder}</h1>
            <p className="text-gray-600">Purchase Order Details</p>
          </div>
          <div className="flex items-center gap-3">
            {purchase.status === PurchaseStatus.PENDING && (
              <>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Order
                </Button>
                <Button onClick={() => setIsApproveDialogOpen(true)} disabled={isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Order
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Purchase Items */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <Package className="w-6 h-6 mr-3 text-blue-600" />
                  Purchase Items ({purchase.purchaseItems.length})
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                      <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchase.purchaseItems.map((item) => (
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
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(item.unitCost)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(item.totalCost)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="px-8 py-6 border-t border-gray-200 bg-gray-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Order Value:</span>
                    <span className="text-2xl font-bold text-gray-900">{formatCurrency(purchase.totalCost)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${getStatusColor(purchase.status)}`}>
                    <StatusIcon className="w-5 h-5 mr-2" />
                    {purchase.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Order Date</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {purchase.purchaseDate.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Created</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {purchase.createdAt.toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  {purchase.approvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Approved</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {purchase.approvedAt.toLocaleDateString('en-PH', {
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

            {/* Supplier Information */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-gray-600" />
                Supplier Information
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{purchase.supplier.name}</h4>
                  {purchase.supplier.contactInfo && (
                    <p className="text-sm text-gray-600 mt-1">{purchase.supplier.contactInfo}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-gray-600" />
                Order Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Items Count</span>
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(purchase.purchaseItems.length)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Quantity</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatNumber(purchase.purchaseItems.reduce((sum, item) => sum + item.quantity, 0))}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-gray-900">Total Value</span>
                  <span className="text-xl font-bold text-gray-900">{formatCurrency(purchase.totalCost)}</span>
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
                  <p className="text-sm text-gray-500">@{purchase.createdBy.username}</p>
                </div>
                
                {approvedByName && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Approved By</h4>
                      <p className="text-base font-semibold text-gray-900">{approvedByName}</p>
                      <p className="text-sm text-gray-500">@{purchase.approvedBy?.username}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Purchase Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve purchase order {purchase.purchaseOrder}? 
              This will mark it as received and update inventory levels.
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
            <Button onClick={handleApprovePurchase} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Order
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
            <DialogTitle>Delete Purchase Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete purchase order {purchase.purchaseOrder}? 
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
            <Button variant="destructive" onClick={handleDeletePurchase} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}