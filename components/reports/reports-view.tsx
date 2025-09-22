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
  PieChart,
  LineChart,
  Target
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getReportsData, type ReportsData } from "@/lib/actions/reports-actions"
import { toast } from "sonner"
import { ReportGenerator } from "./report-generator"

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-[1600px] mx-auto p-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="p-6 bg-white rounded-full mb-6 mx-auto w-fit shadow-lg">
                <BarChart3 className="w-16 h-16 text-blue-600 animate-pulse" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Loading Analytics</h2>
              <p className="text-gray-600">Preparing comprehensive inventory reports...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Enhanced Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Inventory Analytics Hub
            </h1>
            <p className="text-gray-600 text-lg">Real-time insights into your warehouse operations and cost analysis</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4 mr-1" />
              Last updated: {new Date().toLocaleString('en-PH')}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={isPending} className="shadow-sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export Dashboard
            </Button>
          </div>
        </div>

        {/* Enhanced KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Total Value</div>
                  <div className="text-2xl font-bold">{formatCurrency(reportsData.inventorySummary.totalValue)}</div>
                </div>
              </div>
              <div className="text-sm opacity-90">
                {formatNumber(reportsData.inventorySummary.totalItems)} active items
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                <div className="bg-white rounded-full h-2 w-3/4"></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Monthly Entries</div>
                  <div className="text-2xl font-bold">{formatCurrency(reportsData.purchaseSummary.monthlyValue)}</div>
                </div>
              </div>
              <div className="text-sm opacity-90">
                {formatNumber(reportsData.purchaseSummary.monthlyCount)} transactions
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>+12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingDown className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Monthly Issues</div>
                  <div className="text-2xl font-bold">{formatCurrency(reportsData.withdrawalSummary.monthlyValue)}</div>
                </div>
              </div>
              <div className="text-sm opacity-90">
                {formatNumber(reportsData.withdrawalSummary.monthlyCount)} withdrawals
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingDown className="w-3 h-3 mr-1" />
                <span>-5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Activity className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-90">Active Transfers</div>
                  <div className="text-2xl font-bold">{reportsData.transferSummary.activeTransfers}</div>
                </div>
              </div>
              <div className="text-sm opacity-90">
                {formatNumber(reportsData.transferSummary.monthlyCount)} this month
              </div>
              <div className="flex items-center mt-2 text-sm">
                <Activity className="w-3 h-3 mr-1" />
                <span>Real-time tracking</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800 mb-1">Low Stock Alert</h3>
                  <p className="text-sm text-orange-700">
                    {reportsData.inventorySummary.lowStockItems} items below reorder level
                  </p>
                  <Button variant="link" className="p-0 text-orange-700 text-sm mt-1">
                    View Details →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <Package className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Out of Stock</h3>
                  <p className="text-sm text-red-700">
                    {reportsData.inventorySummary.outOfStockItems} items completely out of stock
                  </p>
                  <Button variant="link" className="p-0 text-red-700 text-sm mt-1">
                    Urgent Action Required →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Tabs */}
        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white shadow-sm">
            <TabsTrigger value="generator" className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Report Generator
            </TabsTrigger>
            <TabsTrigger value="weighted-avg" className="flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Weighted Average
            </TabsTrigger>
            <TabsTrigger value="cost-analysis" className="flex items-center">
              <PieChart className="w-4 h-4 mr-2" />
              Cost Analysis
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Stock Movements
            </TabsTrigger>
            <TabsTrigger value="efficiency" className="flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Efficiency
            </TabsTrigger>
            <TabsTrigger value="forecasting" className="flex items-center">
              <LineChart className="w-4 h-4 mr-2" />
              Forecasting
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <ReportGenerator warehouses={warehouses} suppliers={suppliers} />
          </TabsContent>

          <TabsContent value="weighted-avg" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-6 h-6 mr-3 text-blue-600" />
                  Weighted Average Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Advanced Cost Analysis Coming Soon
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Detailed weighted average calculations, cost layer analysis, and variance reporting
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="font-semibold text-blue-600">FIFO</div>
                      <div className="text-sm text-blue-500">First In, First Out</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="font-semibold text-green-600">WAC</div>
                      <div className="text-sm text-green-500">Weighted Average</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="font-semibold text-purple-600">LIFO</div>
                      <div className="text-sm text-purple-500">Last In, First Out</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cost-analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-6 h-6 mr-3 text-purple-600" />
                  Cost Breakdown & Variance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Cost Analysis Dashboard
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Purchase price variance, material cost trends, and profitability analysis
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-6 h-6 mr-3 text-green-600" />
                  Real-time Stock Movement Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Movement Analytics
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Track all inventory movements, transfers, adjustments, and transaction patterns
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-6 h-6 mr-3 text-red-600" />
                  Warehouse Efficiency Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Performance Optimization
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Turnover rates, storage efficiency, and operational performance indicators
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-6 h-6 mr-3 text-indigo-600" />
                  Demand Forecasting & Planning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <LineChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    Predictive Analytics
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Forecast demand patterns, optimize reorder points, and plan inventory levels
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}