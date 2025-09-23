"use client"

import React, { useState, useTransition } from "react"
import {
  BarChart3,
  Download,
  RefreshCw,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Calculator,
  Activity,
  AlertTriangle,
  Calendar,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getReportsData, type ReportsData } from "@/lib/actions/reports-actions"
import { toast } from "sonner"
import { ReportGenerator } from "./report-generator"
import { InventoryReports } from "./inventory-reports"
import { MovementReports } from "./movement-reports"
import { CostReports } from "./cost-report"
import { OperationalReports } from "./operational-reports"



interface ReportsViewProps {
  initialData?: ReportsData
  warehouses?: Array<{ id: string; name: string; location: string | null }>
  suppliers?: Array<{ id: string; name: string }>
}

export function ReportsView({ initialData, warehouses = [], suppliers = [] }: ReportsViewProps) {
  const [reportsData, setReportsData] = useState<ReportsData | undefined>(initialData)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getReportsData()
      
      if (result.success) {
        setReportsData(result.data)
        toast.success("Reports data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh reports")
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

  if (!reportsData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto p-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="p-4 bg-white rounded-lg border mb-4 mx-auto w-fit">
                <BarChart3 className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Reports</h2>
              <p className="text-gray-600">Preparing inventory reports...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Reports & Analytics
            </h1>
            <p className="text-gray-600">Comprehensive inventory and operational reports</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              Last updated: {new Date().toLocaleString('en-PH')}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isPending} size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* KPI Cards - All in one row */}
        <div className="justify-center grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Inventory Value</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(reportsData.inventorySummary.totalValue)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(reportsData.inventorySummary.totalItems)} items</p>
                </div>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Monthly Entries</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(reportsData.purchaseSummary.monthlyValue)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(reportsData.purchaseSummary.monthlyCount)} entries</p>
                </div>
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Monthly Issues</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(reportsData.withdrawalSummary.monthlyValue)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(reportsData.withdrawalSummary.monthlyCount)} withdrawals</p>
                </div>
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Active Transfers</p>
                  <p className="text-lg font-bold text-gray-900">{reportsData.transferSummary.activeTransfers}</p>
                  <p className="text-xs text-gray-500">{formatNumber(reportsData.transferSummary.monthlyCount)} this month</p>
                </div>
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert Card */}
          {reportsData.inventorySummary.lowStockItems > 0 && (
            <Card className="border-0 shadow-sm bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-amber-800">Low Stock</p>
                    <p className="text-lg font-bold text-amber-900">{reportsData.inventorySummary.lowStockItems}</p>
                    <p className="text-xs text-amber-700">items below level</p>
                  </div>
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Out of Stock Alert Card */}
          {reportsData.inventorySummary.outOfStockItems > 0 && (
            <Card className="border-0 shadow-sm bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-red-800">Out of Stock</p>
                    <p className="text-lg font-bold text-red-900">{reportsData.inventorySummary.outOfStockItems}</p>
                    <p className="text-xs text-red-700">items depleted</p>
                  </div>
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Report Tabs - Compact */}
        <Tabs defaultValue="generator" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 bg-white border">
            <TabsTrigger value="generator" className="text-xs">
              <FileText className="w-4 h-4 mr-1" />
              Generator
            </TabsTrigger>
            <TabsTrigger value="inventory" className="text-xs">
              <Package className="w-4 h-4 mr-1" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="movements" className="text-xs">
              <Activity className="w-4 h-4 mr-1" />
              Movements
            </TabsTrigger>
            <TabsTrigger value="cost" className="text-xs">
              <Calculator className="w-4 h-4 mr-1" />
              Cost Analysis
            </TabsTrigger>
            <TabsTrigger value="operational" className="text-xs">
              <Target className="w-4 h-4 mr-1" />
              Operations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-4">
            <ReportGenerator warehouses={warehouses} suppliers={suppliers} />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryReports warehouses={warehouses} suppliers={suppliers} />
          </TabsContent>

          <TabsContent value="movements" className="space-y-4">
            <MovementReports warehouses={warehouses} />
          </TabsContent>

          <TabsContent value="cost" className="space-y-4">
            <CostReports warehouses={warehouses} suppliers={suppliers} />
          </TabsContent>

          <TabsContent value="operational" className="space-y-4">
            <OperationalReports warehouses={warehouses} suppliers={suppliers} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}