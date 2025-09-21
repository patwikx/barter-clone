"use client"

import React, { useState, useTransition } from "react"
import {
  Calculator,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Home,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCostAccountingData, type CostAccountingData } from "@/lib/actions/cost-accounting-actions"
import { CostingMethodType } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface CostAccountingViewProps {
  initialData?: CostAccountingData
}

export function CostAccountingView({ initialData }: CostAccountingViewProps) {
  const [costData, setCostData] = useState<CostAccountingData | undefined>(initialData)
  const [selectedMethod, setSelectedMethod] = useState("all")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getCostAccountingData({ 
        costingMethod: selectedMethod,
        warehouseId: selectedWarehouse,
        dateFrom, 
        dateTo 
      })
      
      if (result.success) {
        setCostData(result.data)
        toast.success("Cost data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh cost data")
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

  if (!costData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto p-8">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="p-4 bg-gray-50 rounded-full mb-4 mx-auto w-fit">
                <Calculator className="w-12 h-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Cost Data</h2>
              <p className="text-gray-600">Please wait while we load your cost accounting data...</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Cost Accounting</h1>
            <p className="text-gray-600">Advanced cost tracking and variance analysis</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Analysis
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-blue-600 mb-1">{formatNumber(costData.summary.totalCostLayers)}</div>
            <div className="text-sm font-medium text-gray-600">Total Cost Layers</div>
            <div className="text-xs text-gray-500 mt-1">Active cost tracking</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-purple-600 mb-1">{formatCurrency(costData.summary.totalInventoryValue)}</div>
            <div className="text-sm font-medium text-gray-600">Total Inventory Value</div>
            <div className="text-xs text-gray-500 mt-1">Current valuation</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-orange-600 mb-1">{costData.summary.totalVariances}</div>
            <div className="text-sm font-medium text-gray-600">Cost Variances</div>
            <div className="text-xs text-gray-500 mt-1">Variance entries</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="text-xl font-bold text-green-600 mb-1">{costData.summary.monthlyAverages}</div>
            <div className="text-sm font-medium text-gray-600">Monthly Averages</div>
            <div className="text-xs text-gray-500 mt-1">Calculated averages</div>
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
                Cost Analysis Filters
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
                  <Label className="text-sm font-medium text-gray-700">Costing Method</Label>
                  <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {Object.values(CostingMethodType).map((method) => (
                        <SelectItem key={method} value={method}>
                          <div className="flex items-center">
                            <Layers className="w-4 h-4 mr-2" />
                            {method.replace(/_/g, ' ')}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Warehouse</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      {costData.warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </SelectItem>
                      ))}
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
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button onClick={handleRefresh} disabled={isPending}>
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Cost Layers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Calculator className="w-6 h-6 mr-3 text-blue-600" />
              Cost Layers ({formatNumber(costData.costLayers.length)})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {costData.costLayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Calculator className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No cost layers found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
                  No cost layers match your current filters or no cost data available.
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Layer Type</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Layer Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {costData.costLayers.map((layer) => (
                    <tr key={layer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-semibold text-gray-900">{layer.item.itemCode}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {layer.item.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{layer.warehouse.name}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant="outline">
                          {layer.layerType.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-600">{formatNumber(layer.quantity)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${layer.remainingQty > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {formatNumber(layer.remainingQty)}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(layer.unitCost)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-purple-600">{formatCurrency(layer.totalCost)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div className="text-sm font-medium text-gray-600">
                            {layer.layerDate.toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Cost Variances */}
        {costData.costVariances.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                Cost Variances ({formatNumber(costData.costVariances.length)})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Variance Type</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Standard Cost</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Variance %</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {costData.costVariances.map((variance) => (
                    <tr key={variance.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <div className="text-sm font-semibold text-gray-900">{variance.item.itemCode}</div>
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {variance.item.description}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <Badge variant="outline">
                          {variance.varianceType.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(variance.standardCost)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(variance.actualCost)}</div>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${variance.varianceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {variance.varianceAmount > 0 ? '+' : ''}{formatCurrency(variance.varianceAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap text-right">
                        <span className={`text-sm font-semibold ${variance.variancePercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {variance.variancePercent > 0 ? '+' : ''}{variance.variancePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div className="text-sm font-medium text-gray-600">
                            {variance.analyzedDate.toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}