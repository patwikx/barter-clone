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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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

const reportTypes: Array<{ value: ReportType; label: string; description: string; icon: React.ElementType }> = [
  {
    value: 'INVENTORY_SUMMARY',
    label: 'Inventory Summary',
    description: 'Current stock levels and values by warehouse',
    icon: Package
  },
  {
    value: 'INVENTORY_VALUATION',
    label: 'Inventory Valuation',
    description: 'Detailed inventory valuation report',
    icon: BarChart3
  },
  {
    value: 'STOCK_MOVEMENT',
    label: 'Stock Movement',
    description: 'All inventory movements within date range',
    icon: Package
  },
  {
    value: 'LOW_STOCK_REPORT',
    label: 'Low Stock Report',
    description: 'Items below reorder levels',
    icon: Package
  },
  {
    value: 'ITEM_ENTRY_REPORT',
    label: 'Item Entry Report',
    description: 'All item entries within date range',
    icon: Package
  },
  {
    value: 'TRANSFER_REPORT',
    label: 'Transfer Report',
    description: 'Inter-warehouse transfers',
    icon: Package
  },
  {
    value: 'WITHDRAWAL_REPORT',
    label: 'Withdrawal Report',
    description: 'Material withdrawals and issuances',
    icon: Package
  },
  {
    value: 'COST_ANALYSIS',
    label: 'Cost Analysis',
    description: 'Cost variance and analysis report',
    icon: BarChart3
  }
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
    
    // Create printable version
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const printContent = generatePrintableHTML(reportData, filters)
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.print()
  }

  const handleExportExcel = () => {
    if (!reportData) return
    
    // Convert to CSV format for Excel compatibility
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
    <div className="space-y-6">
      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Report Type</Label>
              <Select
                value={filters.reportType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as ReportType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
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
              <Label>Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={handleGenerateReport} disabled={isPending}>
                {isPending ? "Generating..." : "Generate Report"}
              </Button>
              {reportData && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print/PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportExcel}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Excel
                  </Button>
                </div>
              )}
            </div>
            {selectedReportType && (
              <Badge variant="outline" className="text-sm">
                <ReportIcon className="w-3 h-3 mr-1" />
                {selectedReportType.label}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Eye className="w-5 h-5 mr-2" />
                Report Preview
              </span>
              <Badge variant="secondary">
                {reportData.summary.totalRecords} records
              </Badge>
            </CardTitle>
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

  switch (reportType) {
    case 'INVENTORY_SUMMARY':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{formatNumber(data.summary.totalRecords)}</div>
              <div className="text-sm text-blue-800">Total Items</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalValue)}</div>
              <div className="text-sm text-green-800">Total Value</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatNumber(data.summary.totalQuantity)}</div>
              <div className="text-sm text-purple-800">Total Quantity</div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Item Code</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Description</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Warehouse</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Quantity</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Unit Cost</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Total Value</th>
                </tr>
              </thead>
              <tbody>
                {data.records.map((record, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-mono">{record.itemCode}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.description}</td>
                    <td className="border border-gray-300 px-4 py-2">{record.warehouse}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatNumber(record.quantity)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{formatCurrency(record.unitCost)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right font-semibold">{formatCurrency(record.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )

    default:
      return (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Report Generated</h3>
          <p className="text-gray-500">
            {formatNumber(data.summary.totalRecords)} records found
          </p>
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

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .report-title { font-size: 18px; color: #666; margin-bottom: 10px; }
        .report-date { font-size: 12px; color: #888; }
        .summary { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; }
        .summary-item { padding: 10px; background: white; border-radius: 5px; }
        .summary-value { font-size: 20px; font-weight: bold; color: #2563eb; }
        .summary-label { font-size: 12px; color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .text-right { text-align: right; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
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
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Item Code</th>
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
              <td>${record.itemCode}</td>
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
        <p>This report was generated by the Warehouse Management System on ${currentDate}</p>
        <p>© ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
      </div>
    </body>
    </html>
  `
}

function generateCSVContent(data: ReportData): string {
  const headers = ['Item Code', 'Description', 'Warehouse', 'Quantity', 'Unit Cost', 'Total Value']
  const csvRows = [
    headers.join(','),
    ...data.records.map(record => [
      `"${record.itemCode}"`,
      `"${record.description}"`,
      `"${record.warehouse}"`,
      record.quantity,
      record.unitCost,
      record.totalValue
    ].join(','))
  ]
  
  return csvRows.join('\n')
}