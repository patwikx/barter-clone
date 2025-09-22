"use client"

import React, { useState } from "react"
import {
  ArrowLeft,
  Plus,
  Package,
  Building,
  User,
  Calendar,
  FileText,
  Truck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { type ItemEntryWithDetails } from "@/lib/actions/item-entry-actions"
import Link from "next/link"

interface ItemEntryDetailViewProps {
  initialEntry: ItemEntryWithDetails
}

export function ItemEntryDetailView({ initialEntry }: ItemEntryDetailViewProps) {
  const [entry] = useState<ItemEntryWithDetails>(initialEntry)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const createdByName = [entry.createdBy.firstName, entry.createdBy.lastName]
    .filter(Boolean).join(' ') || entry.createdBy.username

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/item-entries">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Item Entries
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Item Entry Details</h1>
              <p className="text-gray-600">{entry.purchaseReference || `Entry ${entry.id.slice(-8)}`}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Item Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Item Code</h4>
                    <p className="text-lg font-semibold text-gray-900">{entry.item.itemCode}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Unit of Measure</h4>
                    <p className="text-lg font-semibold text-gray-900">{entry.item.unitOfMeasure}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Description</h4>
                  <p className="text-base text-gray-900">{entry.item.description}</p>
                </div>

                <Separator />

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Quantity</h4>
                    <p className="text-xl font-bold text-blue-600">{formatNumber(entry.quantity)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Landed Cost</h4>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(entry.landedCost)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Total Value</h4>
                    <p className="text-xl font-bold text-purple-600">{formatCurrency(entry.totalValue)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Standard Cost</h4>
                    <p className="text-base text-gray-600">{formatCurrency(entry.item.standardCost)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Cost Variance</h4>
                    <p className={`text-base font-medium ${
                      entry.landedCost > entry.item.standardCost ? 'text-red-600' : 
                      entry.landedCost < entry.item.standardCost ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      {entry.landedCost > entry.item.standardCost ? '+' : ''}
                      {formatCurrency(entry.landedCost - entry.item.standardCost)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {entry.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{entry.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Entry Status */}
            <Card>
              <CardHeader>
                <CardTitle>Entry Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center">
                  <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                    <Plus className="w-4 h-4 mr-2" />
                    Completed
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Entry Date</span>
                    <span className="text-sm font-medium">
                      {entry.entryDate.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm font-medium">
                      {entry.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Warehouse Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2" />
                  Warehouse Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{entry.warehouse.name}</h4>
                  {entry.warehouse.location && (
                    <p className="text-sm text-gray-600 mt-1">{entry.warehouse.location}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Supplier Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">{entry.supplier.name}</h4>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Reference */}
            {entry.purchaseReference && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Purchase Reference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-mono text-sm text-gray-900">{entry.purchaseReference}</p>
                </CardContent>
              </Card>
            )}

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
                  <p className="text-xs text-gray-500">@{entry.createdBy.username}</p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Entry Date</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-900">
                    <Calendar className="w-3 h-3" />
                    <span>{entry.entryDate.toLocaleDateString()}</span>
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