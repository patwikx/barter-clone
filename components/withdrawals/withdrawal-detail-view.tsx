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
import { approveWithdrawal, deleteWithdrawal, type WithdrawalWithDetails } from "@/lib/actions/withdrawal-actions"
import { WithdrawalStatus } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface WithdrawalDetailViewProps {
  initialWithdrawal: WithdrawalWithDetails
}

const getStatusIcon = (status: WithdrawalStatus) => {
  switch (status) {
    case WithdrawalStatus.PENDING:
      return Clock
    case WithdrawalStatus.APPROVED:
      return CheckCircle
    case WithdrawalStatus.COMPLETED:
      return CheckCircle
    case WithdrawalStatus.REJECTED:
      return XCircle
    default:
      return Clock
  }
}

const getStatusColor = (status: WithdrawalStatus) => {
  switch (status) {
    case WithdrawalStatus.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case WithdrawalStatus.APPROVED:
      return "bg-blue-100 text-blue-800"
    case WithdrawalStatus.COMPLETED:
      return "bg-green-100 text-green-800"
    case WithdrawalStatus.REJECTED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function WithdrawalDetailView({ initialWithdrawal }: WithdrawalDetailViewProps) {
  const router = useRouter()
  const [withdrawal, setWithdrawal] = useState<WithdrawalWithDetails>(initialWithdrawal)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleApproveWithdrawal = () => {
    startTransition(async () => {
      const result = await approveWithdrawal(withdrawal.id)

      if (result.success && result.data) {
        setWithdrawal(result.data)
        setIsApproveDialogOpen(false)
        toast.success("Withdrawal approved and completed successfully")
      } else {
        toast.error(result.error || "Failed to approve withdrawal")
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
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const StatusIcon = getStatusIcon(withdrawal.status)
  const requestedByName = [withdrawal.requestedBy.firstName, withdrawal.requestedBy.lastName]
    .filter(Boolean).join(' ') || withdrawal.requestedBy.username
  const approvedByName = withdrawal.approvedBy 
    ? [withdrawal.approvedBy.firstName, withdrawal.approvedBy.lastName]
        .filter(Boolean).join(' ') || withdrawal.approvedBy.username
    : null

  const totalValue = withdrawal.withdrawalItems.reduce((sum, item) => sum + item.totalValue, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/withdrawals">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Withdrawals
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{withdrawal.withdrawalNumber}</h1>
              <p className="text-gray-600">Material Withdrawal Details</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {withdrawal.status === WithdrawalStatus.PENDING && (
              <>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Withdrawal
                </Button>
                <Button onClick={() => setIsApproveDialogOpen(true)} disabled={isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Withdrawal
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Withdrawal
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Withdrawal Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Withdrawal Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawal.withdrawalItems.map((item) => (
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
                          {formatCurrency(item.totalValue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Withdrawal Value:</span>
                    <span className="text-xl font-bold">{formatCurrency(totalValue)}</span>
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
                <CardTitle>Withdrawal Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <Badge className={`${getStatusColor(withdrawal.status)} text-lg px-4 py-2`}>
                    <StatusIcon className="w-4 h-4 mr-2" />
                    {withdrawal.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Withdrawal Date</span>
                    <span className="text-sm font-medium">
                      {withdrawal.withdrawalDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">
                      {withdrawal.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                  {withdrawal.approvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Approved</span>
                      <span className="text-sm font-medium">
                        {withdrawal.approvedAt.toLocaleDateString()}
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
                  <Package className="w-5 h-5 mr-2" />
                  Warehouse Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{withdrawal.warehouse.name}</h4>
                  {withdrawal.warehouse.location && (
                    <p className="text-sm text-gray-600 mt-1">{withdrawal.warehouse.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Withdrawal Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Withdrawal Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items Count</span>
                  <span className="text-sm font-medium">{withdrawal.withdrawalItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Quantity</span>
                  <span className="text-sm font-medium">
                    {formatNumber(withdrawal.withdrawalItems.reduce((sum, item) => sum + item.quantity, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Value</span>
                  <span className="text-lg font-bold">{formatCurrency(totalValue)}</span>
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
                  <h4 className="text-sm font-medium text-gray-700">Requested By</h4>
                  <p className="text-sm text-gray-900">{requestedByName}</p>
                  <p className="text-xs text-gray-500">@{withdrawal.requestedBy.username}</p>
                </div>
                
                {approvedByName && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Approved By</h4>
                      <p className="text-sm text-gray-900">{approvedByName}</p>
                      <p className="text-xs text-gray-500">@{withdrawal.approvedBy?.username}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Purpose */}
            {withdrawal.purpose && (
              <Card>
                <CardHeader>
                  <CardTitle>Purpose</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-900">{withdrawal.purpose}</p>
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
            <DialogTitle>Approve Withdrawal</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve withdrawal {withdrawal.withdrawalNumber}? 
              This will complete the withdrawal and update inventory levels.
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
            <Button onClick={handleApproveWithdrawal} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Withdrawal
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
              Are you sure you want to delete withdrawal {withdrawal.withdrawalNumber}? 
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
            <Button variant="destructive" onClick={handleDeleteWithdrawal} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Withdrawal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}