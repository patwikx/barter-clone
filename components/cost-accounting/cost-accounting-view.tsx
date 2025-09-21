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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getCostAccountingData, type CostAccountingData } from "@/lib/actions/cost-accounting-actions"
import { CostingMethodType } from "@prisma/client"
import { toast } from "sonner"

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
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  if (!costData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Cost Data</h2>
          <p className="text-gray-600">Please wait while we load your cost accounting data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cost Accounting</h1>
          <p className="text-gray-600 mt-1">Advanced cost tracking and variance analysis</p>
        </div>
        <div className="flex items-center space-x-2">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost Layers</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(costData.summary.totalCostLayers)}</div>
            <p className="text-xs text-muted-foreground">
              Active cost tracking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costData.summary.totalInventoryValue)}</div>
            <p className="text-xs text-muted-foreground">
              Current valuation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Variances</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{costData.summary.totalVariances}</div>
            <p className="text-xs text-muted-foreground">
              Variance entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Averages</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{costData.summary.monthlyAverages}</div>
            <p className="text-xs text-muted-foreground">
              Calculated averages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Cost Analysis Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Costing Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {Object.values(CostingMethodType).map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
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
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isPending}>
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cost Layers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Cost Layers ({costData.costLayers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {costData.costLayers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calculator className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No cost layers found</h3>
              <p className="text-gray-500 text-center">
                No cost layers match your current filters or no cost data available.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Layer Type</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>Layer Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costData.costLayers.map((layer) => (
                  <TableRow key={layer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{layer.item.itemCode}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {layer.item.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{layer.warehouse.name}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {layer.layerType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(layer.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={layer.remainingQty > 0 ? 'text-green-600' : 'text-gray-400'}>
                        {formatNumber(layer.remainingQty)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(layer.unitCost)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(layer.totalCost)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{layer.layerDate.toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cost Variances */}
      {costData.costVariances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Cost Variances ({costData.costVariances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Variance Type</TableHead>
                  <TableHead className="text-right">Standard Cost</TableHead>
                  <TableHead className="text-right">Actual Cost</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Variance %</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costData.costVariances.map((variance) => (
                  <TableRow key={variance.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{variance.item.itemCode}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {variance.item.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {variance.varianceType.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(variance.standardCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(variance.actualCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={variance.varianceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                        {variance.varianceAmount > 0 ? '+' : ''}{formatCurrency(variance.varianceAmount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={variance.variancePercent > 0 ? 'text-red-600' : 'text-green-600'}>
                        {variance.variancePercent > 0 ? '+' : ''}{variance.variancePercent.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{variance.analyzedDate.toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}