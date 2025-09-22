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
  Calculator,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Layers,
  PieChart,
  Target,
  Truck,
  ShoppingCart,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  ArrowUpDown,
  Search
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { generateReport, type ReportType, type ReportData } from "@/lib/actions/report-generator-actions"
import { toast } from "sonner"

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
  value: ReportType; 
  label: string; 
  description: string; 
  icon: React.ElementType;
  category: string;
  features: string[];
}> = [
  // Inventory Reports
  {
    value: 'INVENTORY_SUMMARY',
    label: 'Inventory Summary',
    description: 'Current stock levels and values by warehouse',
    icon: Package,
    category: 'Inventory',
    features: ['Current Stock Levels', 'Valuation', 'Multi-Warehouse View']
  },
  {
    value: 'INVENTORY_VALUATION',
    label: 'Inventory Valuation',
    description: 'Detailed inventory valuation with costing methods',
    icon: Calculator,
    category: 'Inventory',
    features: ['Weighted Average Cost', 'FIFO/LIFO Analysis', 'Cost Layers']
  },
  {
    value: 'LOW_STOCK_REPORT',
    label: 'Low Stock Alert',
    description: 'Items below reorder levels requiring attention',
    icon: AlertTriangle,
    category: 'Inventory',
    features: ['Reorder Alerts', 'Safety Stock', 'Procurement Planning']
  },
  
  // Movement Reports
  {
    value: 'STOCK_MOVEMENT',
    label: 'Stock Movement',
    description: 'Complete audit trail of all inventory movements',
    icon: Activity,
    category: 'Movement',
    features: ['Transaction History', 'Movement Types', 'Balance Tracking']
  },
  {
    value: 'TRANSFER_REPORT',
    label: 'Inter-warehouse Transfers',
    description: 'Transfers between warehouse locations',
    icon: Truck,
    category: 'Movement',
    features: ['Transfer Status', 'Transit Times', 'Location Mapping']
  },
  {
    value: 'WITHDRAWAL_REPORT',
    label: 'Material Withdrawals',
    description: 'Items issued from warehouse',
    icon: TrendingDown,
    category: 'Movement',
    features: ['Issue Tracking', 'Department Usage', 'Cost Allocation']
  },

  // Procurement Reports
  {
    value: 'ITEM_ENTRY_REPORT',
    label: 'Item Entries',
    description: 'Purchase receipts and item entries',
    icon: ShoppingCart,
    category: 'Procurement',
    features: ['Purchase History', 'Supplier Performance', 'Cost Tracking']
  },

  // Analysis Reports
  {
    value: 'COST_ANALYSIS',
    label: 'Cost Variance Analysis',
    description: 'Cost analysis and variance reporting',
    icon: PieChart,
    category: 'Analysis',
    features: ['Price Variance', 'Standard vs Actual', 'Trend Analysis']
  }
]

const reportCategories = [
  { value: 'all', label: 'All Reports', icon: FileText },
  { value: 'Inventory', label: 'Inventory Reports', icon: Package },
  { value: 'Movement', label: 'Movement Reports', icon: Activity },
  { value: 'Procurement', label: 'Procurement Reports', icon: ShoppingCart },
  { value: 'Analysis', label: 'Analysis Reports', icon: PieChart }
]

export function ReportGenerator({ warehouses, suppliers }: ReportGeneratorProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'INVENTORY_SUMMARY',
    warehouseId: 'all',
    supplierId: 'all',
    dateFrom: '',
    dateTo: '',
    includeZeroStock: false
  })
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  const filteredReportTypes = reportTypes.filter(rt => {
    const matchesCategory = selectedCategory === 'all' || rt.category === selectedCategory
    const matchesSearch = searchTerm === '' || 
      rt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rt.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

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

  return (
    <div className="space-y-8">
      {/* Report Selection */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <CardTitle className="flex items-center text-2xl">
            <FileText className="w-6 h-6 mr-3 text-blue-600" />
            Professional Report Generator
          </CardTitle>
          <p className="text-gray-600 mt-2">Generate comprehensive inventory and operational reports with advanced filtering options</p>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {/* Category Filter & Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Report Categories</Label>
              <div className="flex flex-wrap gap-2">
                {reportCategories.map((category) => {
                  const CategoryIcon = category.icon
                  return (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                      className="flex items-center"
                    >
                      <CategoryIcon className="w-4 h-4 mr-2" />
                      {category.label}
                    </Button>
                  )
                })}
              </div>
            </div>
            <div className="w-full lg:w-80">
              <Label className="text-sm font-semibold text-gray-700 mb-3 block">Search Reports</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search report types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Report Type Selection */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-4 block">Available Reports</Label>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReportTypes.map((type) => {
                const Icon = type.icon
                const isSelected = filters.reportType === type.value
                return (
                  <div
                    key={type.value}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 bg-white hover:border-blue-300'
                    }`}
                    onClick={() => setFilters(prev => ({ ...prev, reportType: type.value }))}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                      <Badge variant={isSelected ? "default" : "secondary"} className="text-xs">
                        {type.category}
                      </Badge>
                    </div>
                    <h3 className={`font-semibold mb-2 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {type.label}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {type.features.slice(0, 2).map((feature, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Separator />

          {/* Advanced Filters */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold text-gray-800">Filter Options</Label>
              <Badge variant="outline" className="flex items-center">
                <ReportIcon className="w-3 h-3 mr-1" />
                {selectedReportType?.label}
              </Badge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Warehouse Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <Building className="w-4 h-4 mr-2 text-blue-600" />
                  Warehouse Location
                </Label>
                <Select
                  value={filters.warehouseId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, warehouseId: value }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">All Warehouses</span>
                      </div>
                    </SelectItem>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2 text-blue-500" />
                            <span>{warehouse.name}</span>
                          </div>
                          {warehouse.location && (
                            <span className="text-xs text-gray-500 ml-2">({warehouse.location})</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Supplier Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  Supplier
                </Label>
                <Select
                  value={filters.supplierId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, supplierId: value }))}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        <span className="font-medium">All Suppliers</span>
                      </div>
                    </SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-green-500" />
                          <span>{supplier.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quick Date Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                  Quick Date Range
                </Label>
                <Select onValueChange={(value) => {
                  const today = new Date()
                  let fromDate = new Date()
                  
                  switch(value) {
                    case 'today':
                      fromDate = today
                      break
                    case 'week':
                      fromDate.setDate(today.getDate() - 7)
                      break
                    case 'month':
                      fromDate.setMonth(today.getMonth() - 1)
                      break
                    case 'quarter':
                      fromDate.setMonth(today.getMonth() - 3)
                      break
                    case 'year':
                      fromDate.setFullYear(today.getFullYear() - 1)
                      break
                    default:
                      return
                  }
                  
                  setFilters(prev => ({
                    ...prev,
                    dateFrom: fromDate.toISOString().split('T')[0],
                    dateTo: today.toISOString().split('T')[0]
                  }))
                }}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Custom Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Custom Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="h-11"
                />
              </div>
            </div>

            {/* Additional Options */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
              <Checkbox
                id="includeZeroStock"
                checked={filters.includeZeroStock}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeZeroStock: checked as boolean }))}
              />
              <Label htmlFor="includeZeroStock" className="text-sm font-medium text-gray-700 cursor-pointer">
                Include items with zero stock in inventory reports
              </Label>
            </div>
          </div>

          <Separator />

          {/* Generate Report Actions */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleGenerateReport} 
                disabled={isPending}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isPending ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Generate Report
                  </>
                )}
              </Button>
              
              {reportData && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleExportPDF} size="lg">
                    <Printer className="w-4 h-4 mr-2" />
                    Print/PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel} size="lg">
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>

            {selectedReportType && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Selected Report:</div>
                <Badge variant="outline" className="text-sm mt-1">
                  <ReportIcon className="w-3 h-3 mr-1" />
                  {selectedReportType.label}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && (
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center text-xl">
                <Eye className="w-6 h-6 mr-3 text-green-600" />
                Report Preview
              </span>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="px-3 py-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {reportData.summary.totalRecords} records
                </Badge>
                <Badge variant="outline" className="px-3 py-1">
                  Generated: {new Date(reportData.generatedAt).toLocaleString('en-PH')}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <ReportPreview data={reportData} reportType={filters.reportType} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Enhanced Report Preview Component
function ReportPreview({ data, reportType }: { data: ReportData; reportType: ReportType }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  const getSummaryCards = () => {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-700">{formatNumber(data.summary.totalRecords)}</div>
          <div className="text-sm text-blue-600 font-medium">Total Records</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-700">{formatCurrency(data.summary.totalValue)}</div>
          <div className="text-sm text-green-600 font-medium">Total Value</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <Package className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-700">{formatNumber(data.summary.totalQuantity)}</div>
          <div className="text-sm text-purple-600 font-medium">Total Quantity</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
          <Calculator className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-700">{formatCurrency(data.summary.averageValue)}</div>
          <div className="text-sm text-orange-600 font-medium">Average Value</div>
        </div>
      </div>
    )
  }

  const getReportTable = () => {
    const getColumns = () => {
      switch (reportType) {
        case 'INVENTORY_SUMMARY':
        case 'INVENTORY_VALUATION':
        case 'LOW_STOCK_REPORT':
          return ['Item Code', 'Description', 'Warehouse', 'Supplier', 'Quantity', 'Unit Cost', 'Total Value']
        case 'STOCK_MOVEMENT':
          return ['Date', 'Item Code', 'Description', 'Movement Type', 'Quantity', 'Unit Cost', 'Balance']
        case 'ITEM_ENTRY_REPORT':
          return ['Date', 'Item Code', 'Description', 'Supplier', 'Quantity', 'Landed Cost', 'Total Value', 'Reference']
        case 'TRANSFER_REPORT':
          return ['Date', 'Transfer #', 'Item Code', 'Description', 'From → To', 'Quantity', 'Status']
        case 'WITHDRAWAL_REPORT':
          return ['Date', 'Withdrawal #', 'Item Code', 'Description', 'Quantity', 'Unit Cost', 'Total Value', 'Purpose']
        case 'COST_ANALYSIS':
          return ['Item Code', 'Description', 'Variance Type', 'Standard Cost', 'Actual Cost', 'Variance %', 'Total Variance']
        default:
          return ['Item Code', 'Description', 'Warehouse', 'Quantity', 'Unit Cost', 'Total Value']
      }
    }

    const renderRow = (record: any, index: number) => {
      switch (reportType) {
        case 'INVENTORY_SUMMARY':
        case 'INVENTORY_VALUATION':
        case 'LOW_STOCK_REPORT':
          return (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="border border-gray-200 px-4 py-3 font-mono text-sm">{record.itemCode}</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">{record.description}</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">{record.warehouse}</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">{record.supplier || 'N/A'}</td>
              <td className="border border-gray-200 px-4 py-3 text-right text-sm font-medium">{formatNumber(record.quantity)}</td>
              <td className="border border-gray-200 px-4 py-3 text-right text-sm">{formatCurrency(record.unitCost)}</td>
              <td className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold text-green-600">{formatCurrency(record.totalValue)}</td>
            </tr>
          )
        default:
          return (
            <tr key={index} className="hover:bg-gray-50 transition-colors">
              <td className="border border-gray-200 px-4 py-3 font-mono text-sm">{record.itemCode}</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">{record.description}</td>
              <td className="border border-gray-200 px-4 py-3 text-sm">{record.warehouse}</td>
              <td className="border border-gray-200 px-4 py-3 text-right text-sm font-medium">{formatNumber(record.quantity)}</td>
              <td className="border border-gray-200 px-4 py-3 text-right text-sm">{formatCurrency(record.unitCost)}</td>
              <td className="border border-gray-200 px-4 py-3 text-right text-sm font-semibold">{formatCurrency(record.totalValue)}</td>
            </tr>
          )
      }
    }

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
              {getColumns().map((column, idx) => (
                <th key={idx} className="border border-gray-200 px-4 py-4 text-left text-sm font-semibold text-gray-700 bg-gray-50">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.records.slice(0, 50).map((record, index) => renderRow(record, index))}
          </tbody>
        </table>
        {data.records.length > 50 && (
          <div className="p-4 bg-gray-50 border-t text-center text-sm text-gray-600">
            Showing first 50 of {data.records.length} records. Export for complete data.
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {getSummaryCards()}
      {getReportTable()}
    </div>
  )
}

// Enhanced helper functions for export
function generatePrintableHTML(data: ReportData, filters: ReportFilters): string {
  const currentDate = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const reportTitle = reportTypes.find(rt => rt.value === filters.reportType)?.label || 'Report'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle} - ${currentDate}</title>
      <meta charset="utf-8">
      <style>
        @page { margin: 1in; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          margin: 0; 
          color: #333;
          line-height: 1.4;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 3px solid #2563eb; 
          padding-bottom: 20px; 
        }
        .company-name { 
          font-size: 28px; 
          font-weight: bold; 
          color: #1e40af;
          margin-bottom: 8px; 
        }
        .report-title { 
          font-size: 20px; 
          color: #4b5563; 
          margin-bottom: 12px;
          font-weight: 600;
        }
        .report-subtitle { 
          font-size: 14px; 
          color: #6b7280;
          margin-bottom: 8px;
        }
        .report-date { 
          font-size: 12px; 
          color: #9ca3af; 
        }
        .summary { 
          margin: 30px 0; 
          padding: 20px; 
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); 
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }
        .summary-grid { 
          display: grid; 
          grid-template-columns: repeat(4, 1fr); 
          gap: 20px; 
          text-align: center; 
        }
        .summary-item { 
          padding: 15px; 
          background: white; 
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .summary-value { 
          font-size: 22px; 
          font-weight: bold; 
          color: #1e40af; 
          margin-bottom: 4px;
        }
        .summary-label { 
          font-size: 12px; 
          color: #64748b; 
          font-weight: 500;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px;
          background: white;
        }
        th, td { 
          border: 1px solid #d1d5db; 
          padding: 10px 8px; 
          text-align: left;
          font-size: 11px;
        }
        th { 
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); 
          font-weight: 600;
          color: #374151;
        }
        .text-right { text-align: right; }
        .font-mono { font-family: 'Courier New', monospace; }
        .footer { 
          margin-top: 40px; 
          text-align: center; 
          font-size: 10px; 
          color: #9ca3af; 
          border-top: 1px solid #e5e7eb; 
          padding-top: 15px; 
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Inventory Management System</div>
        <div class="report-title">${reportTitle}</div>
        <div class="report-subtitle">${data.subtitle}</div>
        <div class="report-date">Generated on ${currentDate}</div>
      </div>
      
      <div class="summary">
        <div class="summary-grid">
          <div class="summary-item">
            <div class="summary-value">${data.summary.totalRecords.toLocaleString()}</div>
            <div class="summary-label">Total Records</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">₱${data.summary.totalValue.toLocaleString()}</div>
            <div class="summary-label">Total Value</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">${data.summary.totalQuantity.toLocaleString()}</div>
            <div class="summary-label">Total Quantity</div>
          </div>
          <div class="summary-item">
            <div class="summary-value">₱${data.summary.averageValue.toLocaleString()}</div>
            <div class="summary-label">Average Value</div>
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="font-mono">Item Code</th>
            <th>Description</th>
            <th>Warehouse</th>
            <th class="text-right">Quantity</th>
            <th class="text-right">Unit Cost</th>
            <th class="text-right">Total Value</th>
          </tr>
        </thead>
        <tbody>
          ${data.records.map(record => `
            <tr>
              <td class="font-mono">${record.itemCode}</td>
              <td>${record.description}</td>
              <td>${record.warehouse}</td>
              <td class="text-right">${record.quantity.toLocaleString()}</td>
              <td class="text-right">₱${record.unitCost.toLocaleString()}</td>
              <td class="text-right">₱${record.totalValue.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        <p><strong>Report Details:</strong> ${data.title} | Records: ${data.summary.totalRecords.toLocaleString()} | Generated: ${currentDate}</p>
        <p>© ${new Date().getFullYear()} Inventory Management System. This report contains confidential business information.</p>
      </div>
    </body>
    </html>
  `
}

function generateCSVContent(data: ReportData): string {
  const headers = ['Item Code', 'Description', 'Warehouse', 'Supplier', 'Quantity', 'Unit Cost', 'Total Value', 'Date', 'Reference', 'Notes']
  const csvRows = [
    `"${data.title} - Generated ${new Date().toLocaleString()}"`,
    '',
    headers.join(','),
    ...data.records.map(record => [
      `"${record.itemCode}"`,
      `"${record.description.replace(/"/g, '""')}"`,
      `"${record.warehouse}"`,
      `"${record.supplier || 'N/A'}"`,
      record.quantity,
      record.unitCost,
      record.totalValue,
      `"${record.date || ''}"`,
      `"${record.reference || ''}"`,
      `"${record.notes || ''}"`
    ].join(','))
  ]
  
  return csvRows.join('\n')
}