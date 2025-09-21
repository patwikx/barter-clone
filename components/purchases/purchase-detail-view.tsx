"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
      currency: 'PHP'
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
              <h1 className="text-2xl font-bold text-gray-900">{purchase.purchaseOrder}</h1>
              <p className="text-gray-600">Purchase Order Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Purchase Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Purchase Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchase.purchaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.item.itemCode}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {item.item.description}
                            </div>
                            <div className="text-xs text-gray-400">
                              UOM: {item.item.unitOfMeasure}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.quantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitCost)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.totalCost)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Order Value:</span>
                    <span className="text-xl font-bold">{formatCurrency(purchase.totalCost)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <Badge className={`${getStatusColor(purchase.status)} text-lg px-4 py-2`}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {purchase.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Order Date</span>
                    <span className="text-sm font-medium">
                      {purchase.purchaseDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">
                      {purchase.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  {purchase.approvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Approved</span>
                      <span className="text-sm font-medium">
                        {purchase.approvedAt.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{purchase.supplier.name}</h4>
                  {purchase.supplier.contactInfo && (
                    <p className="text-sm text-gray-600 mt-1">{purchase.supplier.contactInfo}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items Count</span>
                  <span className="text-sm font-medium">{purchase.purchaseItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Quantity</span>
                  <span className="text-sm font-medium">
                    {formatNumber(purchase.purchaseItems.reduce((sum, item) => sum + item.quantity, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Value</span>
                  <span className="text-lg font-bold">{formatCurrency(purchase.totalCost)}</span>
                </div>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Created By</h4>
                  <p className="text-sm text-gray-900">{createdByName}</p>
                  <p className="text-xs text-gray-500">@{purchase.createdBy.username}</p>
                </div>
                
                {approvedByName && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Approved By</h4>
                      <p className="text-sm text-gray-900">{approvedByName}</p>
                      <p className="text-xs text-gray-500">@{purchase.approvedBy?.username}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
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