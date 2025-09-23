"use client"

import React, { useState, useTransition } from "react"
import {
  FileText,
  Download,
  Printer,
  Package,
  Building,
  BarChart3,
  Filter,
  Eye,
  Calendar,
  TrendingUp,
  TrendingDown,
  Calculator,
  Layers,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Plus,
  ArrowRightLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { generateReport } from "@/lib/actions/report-generator-actions"
import { ReportsData } from "@/lib/actions/reports-actions"
import { ReportType } from "@/types/report-types"

interface ReportGeneratorProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
}

interface ReportFilters {
  reportType: ReportType
  warehouseId: string
  supplierId: string
  dateFrom: string
  dateTo: string
  includeZeroStock: boolean
}

const reportTypes: Array<{ 
  value: ReportType
  label: string
  description: string
  icon: React.ElementType
  category: 'inventory' | 'transactions' | 'cost' | 'analysis'
}> = [
  {
    value: 'INVENTORY_SUMMARY',
    label: 'Inventory Summary',
    description: 'Current stock levels and values by warehouse',
    icon: Package,
    category: 'inventory'
  },
  {
    value: 'INVENTORY_VALUATION',
    label: 'Inventory Valuation',
    description: 'Detailed inventory valuation with landed costs',
    icon: DollarSign,
    category: 'inventory'
  },
  {
    value: 'STOCK_MOVEMENT',
    label: 'Stock Movement',
    description: 'All inventory movements within date range',
    icon: TrendingUp,
    category: 'transactions'
  },
  {
    value: 'LOW_STOCK_REPORT',
    label: 'Low Stock Report',
    description: 'Items below reorder levels requiring attention',
    icon: AlertTriangle,
    category: 'inventory'
  },
  {
    value: 'ITEM_ENTRY_REPORT',
    label: 'Item Entry Report',
    description: 'All item entries with landed costs within period',
    icon: Plus,
    category: 'transactions'
  },
  {
    value: 'TRANSFER_REPORT',
    label: 'Transfer Report',
    description: 'Inter-warehouse transfers and movements',
    icon: ArrowRightLeft,
    category: 'transactions'
  },
  {
    value: 'WITHDRAWAL_REPORT',
    label: 'Withdrawal Report',
    description: 'Material withdrawals and issuances',
    icon: TrendingDown,
    category: 'transactions'
  },
  {
    value: 'COST_ANALYSIS',
    label: 'Cost Analysis',
    description: 'Cost variance and weighted average analysis',
    icon: Calculator,
    category: 'cost'
  }
]

const reportCategories = {
  inventory: { label: 'Inventory Reports', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  transactions: { label: 'Transaction Reports', color: 'text-green-600', bgColor: 'bg-green-50' },
  cost: { label: 'Cost Analysis', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  analysis: { label: 'Advanced Analysis', color: 'text-orange-600', bgColor: 'bg-orange-50' }
}

export function ReportGenerator({ warehouses, suppliers }: ReportGeneratorProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'INVENTORY_SUMMARY',
    warehouseId: 'all',
    supplierId: 'all',
    dateFrom: '',
    dateTo: '',
    includeZeroStock: false
  })
  const [reportData, setReportData] = useState<ReportsData | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleGenerateReport = () => {
    startTransition(async () => {
      const result = await generateReport(filters)
      
      if (result.success && result.data) {
        setReportData(result.data)
        toast.success("Report generated successfully")
      } else {
        toast.error(result.error || "Failed to generate report")
      }
    })
  }

  const handleExportPDF = () => {
    if (!reportData) return
    
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = generatePrintableHTML(reportData, filters)
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExportExcel = () => {
    if (!reportData) return
    
    const csvContent = generateCSVContent(reportData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filters.reportType}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const selectedReportType = reportTypes.find(rt => rt.value === filters.reportType)
  const ReportIcon = selectedReportType?.icon || FileText
  const categoryInfo = selectedReportType ? reportCategories[selectedReportType.category] : reportCategories.inventory

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

  return (
    <div className="space-y-8">
      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Categories */}
          <div className="space-y-4">
            <Label className="text-base font-semibold text-gray-900">Report Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(reportCategories).map(([category, info]) => {
                const categoryReports = reportTypes.filter(rt => rt.category === category)
                
                return (
                  <div key={category} className={`border border-gray-200 rounded-lg p-4 ${info.bgColor}`}>
                    <h4 className={`font-semibold ${info.color} mb-3`}>{info.label}</h4>
                    <div className="space-y-2">
                      {categoryReports.map((type) => {
                        const Icon = type.icon
                        const isSelected = filters.reportType === type.value
                        
                        return (
                          <div
                            key={type.value}
                            className={`p-3 rounded-md border cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-sm' 
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            }`}
                            onClick={() => setFilters(prev => ({ ...prev, reportType: type.value }))}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${
                                isSelected ? 'bg-blue-100' : 'bg-gray-100'
                              }`}>
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium text-sm ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                  {type.label}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {type.description}
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Warehouse</Label>
              <Select
                value={filters.warehouseId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, warehouseId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        <span>{warehouse.name}</span>
                        {warehouse.location && (
                          <span className="text-gray-500 ml-2">({warehouse.location})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Supplier</Label>
              <Select
                value={filters.supplierId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, supplierId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="includeZeroStock"
                checked={filters.includeZeroStock}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeZeroStock: checked }))}
              />
              <Label htmlFor="includeZeroStock" className="text-sm font-medium text-gray-700">
                Include zero stock items
              </Label>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button onClick={handleGenerateReport} disabled={isPending} className="h-10 px-6">
                {isPending ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
              
              {reportData && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleExportPDF} className="h-10 px-4">
                    <Printer className="w-4 h-4 mr-2" />
                    Print/PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} className="h-10 px-4">
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Selected Report Info */}
          {selectedReportType && (
            <div className={`p-4 rounded-lg border ${categoryInfo.bgColor} border-gray-200`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                  <ReportIcon className={`w-5 h-5 ${categoryInfo.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${categoryInfo.color}`}>{selectedReportType.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedReportType.description}</p>
                </div>
                <Badge variant="outline" className={`${categoryInfo.color} border-current`}>
                  {categoryInfo.label.split(' ')[0]}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Eye className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle>{reportData.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{reportData.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="text-sm">
                  {formatNumber(reportData.summary.totalRecords)} records
                </Badge>
                <div className="text-sm text-gray-500">
                  Generated: {reportData.generatedAt.toLocaleString('en-PH', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ReportPreview data={reportData} reportType={filters.reportType} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Report Preview Component
interface ReportPreviewProps {
  data: ReportData
  reportType: ReportType
}

function ReportPreview({ data, reportType }: ReportPreviewProps) {
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

  const formatDecimal = (num: number, decimals: number = 2) => {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num)
  }

  // Summary Cards
  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-blue-600">{formatNumber(data.summary.totalRecords)}</p>
          </div>
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Quantity</p>
            <p className="text-2xl font-bold text-green-600">{formatNumber(data.summary.totalQuantity)}</p>
          </div>
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Value</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(data.summary.totalValue)}</p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Average Value</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.summary.averageValue)}</p>
          </div>
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-orange-600" />
          </div>
        </div>
      </div>
    </div>
  )

  switch (reportType) {
    case 'INVENTORY_SUMMARY':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Current Inventory Summary
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Landed Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.supplier || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatNumber(record.quantity)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatCurrency(record.unitCost)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">{formatCurrency(record.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    case 'INVENTORY_VALUATION':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Inventory Valuation Details
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Weighted Avg Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => {
                    const percentOfTotal = data.summary.totalValue > 0 
                      ? (record.totalValue / data.summary.totalValue) * 100 
                      : 0
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatNumber(record.quantity)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatCurrency(record.unitCost)}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-right text-purple-600">{formatCurrency(record.totalValue)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-gray-600">{formatDecimal(percentOfTotal, 1)}%</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    case 'STOCK_MOVEMENT':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="font-semibold text-gray-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2" />
                Stock Movement History
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Movement Type</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Landed Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => {
                    const isInbound = record.quantity > 0
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                        <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={isInbound ? 'text-green-700 border-green-200' : 'text-red-700 border-red-200'}>
                            {record.status?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className={`py-3 px-4 text-sm font-medium text-right ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                          {isInbound ? '+' : ''}{formatNumber(Math.abs(record.quantity))}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatCurrency(record.unitCost)}</td>
                        <td className={`py-3 px-4 text-sm font-semibold text-right ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                          {isInbound ? '+' : ''}{formatCurrency(Math.abs(record.totalValue))}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{record.reference || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    case 'LOW_STOCK_REPORT':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-red-50">
              <h4 className="font-semibold text-red-900 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Low Stock Items Requiring Attention
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Landed Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => {
                    const priority = record.quantity === 0 ? 'Critical' : record.quantity < 10 ? 'High' : 'Medium'
                    const priorityColor = priority === 'Critical' ? 'text-red-700 bg-red-100 border-red-200' :
                                        priority === 'High' ? 'text-orange-700 bg-orange-100 border-orange-200' :
                                        'text-yellow-700 bg-yellow-100 border-yellow-200'
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.supplier || '-'}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-right text-red-600">{formatNumber(record.quantity)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatCurrency(record.unitCost)}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-right text-gray-900">{formatCurrency(record.totalValue)}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className={priorityColor}>
                            {priority}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    case 'ITEM_ENTRY_REPORT':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
              <h4 className="font-semibold text-green-900 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Item Entry History
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Landed Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                      <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.supplier || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-green-600">{formatNumber(record.quantity)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatCurrency(record.unitCost)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-right text-green-600">{formatCurrency(record.totalValue)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{record.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    case 'TRANSFER_REPORT':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
              <h4 className="font-semibold text-blue-900 flex items-center">
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Inter-Warehouse Transfers
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Transfer Route</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                      <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-blue-600">{formatNumber(record.quantity)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={
                          record.status === 'COMPLETED' ? 'text-green-700 border-green-200' :
                          record.status === 'IN_TRANSIT' ? 'text-blue-700 border-blue-200' :
                          'text-red-700 border-red-200'
                        }>
                          {record.status?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{record.reference || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    case 'WITHDRAWAL_REPORT':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-orange-50">
              <h4 className="font-semibold text-orange-900 flex items-center">
                <TrendingDown className="w-4 h-4 mr-2" />
                Material Withdrawals
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Landed Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                      <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-red-600">{formatNumber(record.quantity)}</td>
                      <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatCurrency(record.unitCost)}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-right text-red-600">{formatCurrency(record.totalValue)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={
                          record.status === 'COMPLETED' ? 'text-green-700 border-green-200' :
                          'text-red-700 border-red-200'
                        }>
                          {record.status?.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    case 'COST_ANALYSIS':
      return (
        <div className="space-y-6">
          <SummaryCards />
          
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
              <h4 className="font-semibold text-purple-900 flex items-center">
                <Calculator className="w-4 h-4 mr-2" />
                Cost Variance Analysis
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Actual Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Variance</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Variance Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.records.map((record, index) => {
                    const isPositiveVariance = record.totalValue > 0
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-600">{record.date}</td>
                        <td className="py-3 px-4 text-sm font-mono font-medium text-gray-900">{record.itemCode}</td>
                        <td className="py-3 px-4 text-sm text-gray-900 max-w-xs truncate">{record.description}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{record.warehouse}</td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatNumber(record.quantity)}</td>
                        <td className="py-3 px-4 text-sm font-medium text-right text-gray-900">{formatCurrency(record.unitCost)}</td>
                        <td className={`py-3 px-4 text-sm font-semibold text-right ${isPositiveVariance ? 'text-red-600' : 'text-green-600'}`}>
                          {isPositiveVariance ? '+' : ''}{formatCurrency(record.totalValue)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">
                            {record.status?.replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 max-w-xs truncate">{record.notes || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Report Generated</h3>
          <p className="text-gray-500 mb-4">
            {formatNumber(data.summary.totalRecords)} records found
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">{formatNumber(data.summary.totalQuantity)}</div>
              <div className="text-xs text-gray-500">Total Quantity</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">{formatCurrency(data.summary.totalValue)}</div>
              <div className="text-xs text-gray-500">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">{formatCurrency(data.summary.averageValue)}</div>
              <div className="text-xs text-gray-500">Average Value</div>
            </div>
          </div>
        </div>
      )
  }
}

// Helper functions for export
function generatePrintableHTML(data: ReportData, filters: ReportFilters): string {
  const currentDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const reportTitle = reportTypes.find(rt => rt.value === filters.reportType)?.label || 'Report'

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #1f2937; }
        .report-title { font-size: 18px; color: #6b7280; margin-bottom: 10px; }
        .report-date { font-size: 12px; color: #9ca3af; }
        .summary { margin: 20px 0; padding: 15px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; text-align: center; }
        .summary-item { padding: 15px; background: white; border-radius: 8px; border: 1px solid #e5e7eb; }
        .summary-value { font-size: 20px; font-weight: bold; color: #2563eb; margin-bottom: 5px; }
        .summary-label { font-size: 12px; color: #6b7280; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #e5e7eb; padding: 12px 8px; text-align: left; }
        th { background-color: #f9fafb; font-weight: 600; color: #374151; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-mono { font-family: 'Courier New', monospace; }
        .font-semibold { font-weight: 600; }
        .text-green { color: #059669; }
        .text-red { color: #dc2626; }
        .text-blue { color: #2563eb; }
        .text-purple { color: #7c3aed; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Warehouse Management System</div>
        <div class="report-title">${reportTitle}</div>
        <div class="report-date">Generated on ${currentDate}</div>
      </div>
      
      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${formatNumber(data.summary.totalRecords)}</div>
            <div class="summary-label">Total Records</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${formatNumber(data.summary.totalQuantity)}</div>
            <div class="summary-label">Total Quantity</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${formatCurrency(data.summary.totalValue)}</div>
            <div class="summary-label">Total Value</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${formatCurrency(data.summary.averageValue)}</div>
            <div class="summary-label">Average Value</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item Code</th>
            <th>Description</th>
            <th>Warehouse</th>
            <th>Supplier</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Landed Cost</th>
            <th class="text-right">Total Value</th>
            ${filters.reportType === 'STOCK_MOVEMENT' ? '<th>Date</th><th>Type</th>' : ''}
            ${filters.reportType === 'COST_ANALYSIS' ? '<th>Variance %</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${data.records.map(record => `
            <tr>
              <td class="font-mono">${record.itemCode}</td>
              <td>${record.description}</td>
              <td>${record.warehouse}</td>
              <td>${record.supplier || '-'}</td>
              <td class="text-right font-semibold">${formatNumber(record.quantity)}</td>
              <td class="text-right">${formatCurrency(record.unitCost)}</td>
              <td class="text-right font-semibold">${formatCurrency(record.totalValue)}</td>
              ${filters.reportType === 'STOCK_MOVEMENT' ? `<td>${record.date || '-'}</td><td>${record.status || '-'}</td>` : ''}
              ${filters.reportType === 'COST_ANALYSIS' ? `<td class="text-right">${record.notes || '-'}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p>This report was generated by the Warehouse Management System on ${currentDate}</p>
        <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

function generateCSVContent(data: ReportData): string {
  const headers = ['Item Code', 'Description', 'Warehouse', 'Supplier', 'Quantity', 'Landed Cost', 'Total Value', 'Date', 'Status', 'Reference', 'Notes']
  const csvRows = [
    headers.join(','),
    ...data.records.map(record => [
      `"${record.itemCode}"`,
      `"${record.description}"`,
      `"${record.warehouse}"`,
      `"${record.supplier || ''}"`,
      record.quantity,
      record.unitCost,
      record.totalValue,
      `"${record.date || ''}"`,
      `"${record.status || ''}"`,
      `"${record.reference || ''}"`,
      `"${record.notes || ''}"`,
    ].join(','))
  ]
  
  return csvRows.join('\n')
}