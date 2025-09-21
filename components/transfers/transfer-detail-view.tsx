"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/transfers">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Transfers
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{transfer.transferNumber}</h1>
              <p className="text-gray-600">Stock Transfer Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transfer Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Transfer Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transfer.transferItems.map((item) => (
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Items:</span>
                    <span className="text-xl font-bold">{transfer.transferItems.length}</span>
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
                <CardTitle>Transfer Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <Badge className={`${getStatusColor(transfer.status)} text-lg px-4 py-2`}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {transfer.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Transfer Date</span>
                    <span className="text-sm font-medium">
                      {transfer.transferDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">
                      {transfer.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  {transfer.approvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Approved</span>
                      <span className="text-sm font-medium">
                        {transfer.approvedAt.toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Warehouse Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowRightLeft className="w-5 h-5 mr-2" />
                  Transfer Route
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">From Warehouse</h4>
                  <p className="text-sm text-gray-900">{transfer.fromWarehouse.name}</p>
                  {transfer.fromWarehouse.location && (
                    <p className="text-xs text-gray-500">{transfer.fromWarehouse.location}</p>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <ArrowRightLeft className="w-6 h-6 text-blue-500" />
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">To Warehouse</h4>
                  <p className="text-sm text-gray-900">{transfer.toWarehouse.name}</p>
                  {transfer.toWarehouse.location && (
                    <p className="text-xs text-gray-500">{transfer.toWarehouse.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transfer Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Transfer Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items Count</span>
                  <span className="text-sm font-medium">{transfer.transferItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Quantity</span>
                  <span className="text-sm font-medium">
                    {formatNumber(transfer.transferItems.reduce((sum, item) => sum + item.quantity, 0))}
                  </span>
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
                  <p className="text-xs text-gray-500">@{transfer.createdBy.username}</p>
                </div>
                
                {approvedByName && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Approved By</h4>
                      <p className="text-sm text-gray-900">{approvedByName}</p>
                      <p className="text-xs text-gray-500">@{transfer.approvedBy?.username}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {transfer.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900">{transfer.notes}</p>
                </CardContent>
              </Card>
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