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
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
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
  const [selectedReport, setSelectedReport] = useState("inventory")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

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
        <div className="max-w-[1600px] mx-auto p-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="p-4 bg-gray-50 rounded-full mb-4 mx-auto w-fit">
                <BarChart3 className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Reports</h2>
              <p className="text-gray-600">Please wait while we load your reports data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
            <p className="text-gray-600">Comprehensive reporting and business intelligence</p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-purple-600 mb-1">{formatCurrency(reportsData.inventorySummary.totalValue)}</div>
            <div className="text-sm font-medium text-gray-600">Total Inventory Value</div>
            <div className="text-xs text-gray-500 mt-1">{formatNumber(reportsData.inventorySummary.totalItems)} items</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-green-600 mb-1">{formatCurrency(reportsData.purchaseSummary.monthlyValue)}</div>
            <div className="text-sm font-medium text-gray-600">Monthly Purchases</div>
            <div className="text-xs text-gray-500 mt-1">{formatNumber(reportsData.purchaseSummary.monthlyCount)} orders</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-red-600 mb-1">{formatCurrency(reportsData.withdrawalSummary.monthlyValue)}</div>
            <div className="text-sm font-medium text-gray-600">Monthly Withdrawals</div>
            <div className="text-xs text-gray-500 mt-1">{formatNumber(reportsData.withdrawalSummary.monthlyCount)} requests</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Package className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-blue-600 mb-1">{reportsData.transferSummary.activeTransfers}</div>
            <div className="text-sm font-medium text-gray-600">Active Transfers</div>
            <div className="text-xs text-gray-500 mt-1">{formatNumber(reportsData.transferSummary.monthlyCount)} this month</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="px-8 py-6 border-b border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Filter className="w-6 h-6 mr-3 text-blue-600" />
                Report Filters
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {isFilterExpanded ? 'Collapse' : 'Expand'}
                </span>
                {isFilterExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          {isFilterExpanded && (
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Report Type</Label>
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
                  <Label className="text-sm font-medium text-gray-700">Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">&nbsp;</Label>
                  <Button onClick={handleRefresh} disabled={isPending} className="w-full">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Report Content */}
        <ReportGenerator warehouses={warehouses} suppliers={suppliers} />
      </div>
    </div>
  )
}