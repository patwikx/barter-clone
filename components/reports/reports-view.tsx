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
  Filter,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getReportsData, type ReportsData } from "@/lib/actions/reports-actions"
import { toast } from "sonner"

interface ReportsViewProps {
  initialData?: ReportsData
}

export function ReportsView({ initialData }: ReportsViewProps) {
  const [reportsData, setReportsData] = useState<ReportsData | undefined>(initialData)
  const [selectedReport, setSelectedReport] = useState("inventory")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getReportsData({ dateFrom, dateTo })
      
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
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  if (!reportsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Reports</h2>
          <p className="text-gray-600">Please wait while we load your reports data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive reporting and business intelligence</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                  <SelectItem value="movements">Movement Report</SelectItem>
                  <SelectItem value="purchases">Purchase Report</SelectItem>
                  <SelectItem value="transfers">Transfer Report</SelectItem>
                  <SelectItem value="withdrawals">Withdrawal Report</SelectItem>
                  <SelectItem value="cost">Cost Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleRefresh} disabled={isPending} className="w-full">
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportsData.inventorySummary.totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(reportsData.inventorySummary.totalItems)} items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Purchases</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(reportsData.purchaseSummary.monthlyValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(reportsData.purchaseSummary.monthlyCount)} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Withdrawals</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(reportsData.withdrawalSummary.monthlyValue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(reportsData.withdrawalSummary.monthlyCount)} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transfers</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{reportsData.transferSummary.activeTransfers}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(reportsData.transferSummary.monthlyCount)} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Report Generation</h3>
            <p className="text-gray-500 text-center mb-6">
              Select your filters and click &quot;Generate Report&quot; to view detailed analytics.
            </p>
            <Button onClick={handleRefresh} disabled={isPending}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Generate {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}