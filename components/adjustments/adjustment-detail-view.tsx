"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Settings,
  Package,
  AlertTriangle,
  RotateCcw,
  User,
  Calendar,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { type AdjustmentWithDetails } from "@/lib/actions/adjustments-actions"
import { AdjustmentType } from "@prisma/client"
import Link from "next/link"

interface AdjustmentDetailViewProps {
  initialAdjustment: AdjustmentWithDetails
}

const getAdjustmentTypeIcon = (type: AdjustmentType) => {
  switch (type) {
    case AdjustmentType.PHYSICAL_COUNT:
      return Package
    case AdjustmentType.DAMAGE:
      return AlertTriangle
    case AdjustmentType.SHRINKAGE:
      return RotateCcw
    case AdjustmentType.FOUND:
      return Package
    case AdjustmentType.CORRECTION:
      return Settings
    case AdjustmentType.REVALUATION:
      return RotateCcw
    default:
      return Settings
  }
}

const getAdjustmentTypeColor = (type: AdjustmentType) => {
  switch (type) {
    case AdjustmentType.PHYSICAL_COUNT:
      return "bg-blue-100 text-blue-800"
    case AdjustmentType.DAMAGE:
      return "bg-red-100 text-red-800"
    case AdjustmentType.SHRINKAGE:
      return "bg-orange-100 text-orange-800"
    case AdjustmentType.FOUND:
      return "bg-green-100 text-green-800"
    case AdjustmentType.CORRECTION:
      return "bg-purple-100 text-purple-800"
    case AdjustmentType.REVALUATION:
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function AdjustmentDetailView({ initialAdjustment }: AdjustmentDetailViewProps) {
  const [adjustment] = useState<AdjustmentWithDetails>(initialAdjustment)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const TypeIcon = getAdjustmentTypeIcon(adjustment.adjustmentType)
  const adjustedByName = [adjustment.adjustedBy.firstName, adjustment.adjustedBy.lastName]
    .filter(Boolean).join(' ') || adjustment.adjustedBy.username

  const totalImpact = adjustment.adjustmentItems.reduce((sum, item) => sum + item.totalAdjustment, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/adjustments">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Adjustments
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{adjustment.adjustmentNumber}</h1>
              <p className="text-gray-600">Inventory Adjustment Details</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Adjustment Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Adjustment Items
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">System Qty</TableHead>
                      <TableHead className="text-right">Actual Qty</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead className="text-right">Unit Cost</TableHead>
                      <TableHead className="text-right">Total Impact</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustment.adjustmentItems.map((item) => (
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
                          {formatNumber(item.systemQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(item.actualQuantity)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${item.adjustmentQuantity > 0 ? 'text-green-600' : item.adjustmentQuantity < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {item.adjustmentQuantity > 0 ? '+' : ''}{formatNumber(item.adjustmentQuantity)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unitCost)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={`${item.totalAdjustment > 0 ? 'text-green-600' : item.totalAdjustment < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {item.totalAdjustment > 0 ? '+' : ''}{formatCurrency(item.totalAdjustment)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Adjustment Impact:</span>
                    <span className={`text-xl font-bold ${totalImpact > 0 ? 'text-green-600' : totalImpact < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {totalImpact > 0 ? '+' : ''}{formatCurrency(totalImpact)}
                    </span>
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
                <CardTitle>Adjustment Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <Badge className={`${getAdjustmentTypeColor(adjustment.adjustmentType)} text-lg px-4 py-2`}>
                    <TypeIcon className="w-4 h-4 mr-2" />
                    {adjustment.adjustmentType.replace(/_/g, ' ')}
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Adjustment Date</span>
                    <span className="text-sm font-medium">
                      {adjustment.adjustedAt.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">
                      {adjustment.createdAt.toLocaleDateString()}
                    </span>
                  </div>
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
                  <h4 className="font-medium text-gray-900">{adjustment.warehouse.name}</h4>
                  {adjustment.warehouse.location && (
                    <p className="text-sm text-gray-600 mt-1">{adjustment.warehouse.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Adjustment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Adjustment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Items Count</span>
                  <span className="text-sm font-medium">{adjustment.adjustmentItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Variance</span>
                  <span className="text-sm font-medium">
                    {formatNumber(adjustment.adjustmentItems.reduce((sum, item) => sum + item.adjustmentQuantity, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Impact</span>
                  <span className={`text-lg font-bold ${totalImpact > 0 ? 'text-green-600' : totalImpact < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    {totalImpact > 0 ? '+' : ''}{formatCurrency(totalImpact)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Reason and Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Reason & Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Reason</h4>
                  <p className="text-sm text-gray-900">{adjustment.reason}</p>
                </div>
                
                {adjustment.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Notes</h4>
                      <p className="text-sm text-gray-900">{adjustment.notes}</p>
                    </div>
                  </>
                )}
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
                  <h4 className="text-sm font-medium text-gray-700">Adjusted By</h4>
                  <p className="text-sm text-gray-900">{adjustedByName}</p>
                  <p className="text-xs text-gray-500">@{adjustment.adjustedBy.username}</p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Adjustment Date</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-900">
                    <Calendar className="w-3 h-3" />
                    <span>{adjustment.adjustedAt.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}