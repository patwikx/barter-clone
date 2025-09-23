"use client"

import React, { useState, useTransition } from "react"
import {
  FileText,
  Download,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { generateReport } from "@/lib/actions/report-generator-actions"
import { ReportFilters, ReportType, ReportData } from "@/types/report-types"
import { toast } from "sonner"
import { getCategoriesForSelection } from "@/lib/actions/category-actions"
import { useState, useEffect } from "react"

interface ReportGeneratorProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
}

const REPORT_TYPES: Array<{ value: ReportType; label: string; description: string }> = [
  { value: 'INVENTORY_SUMMARY', label: 'Inventory Summary', description: 'Current stock levels by warehouse' },
  { value: 'INVENTORY_VALUATION', label: 'Inventory Valuation', description: 'Detailed inventory valuation report' },
  { value: 'STOCK_MOVEMENT', label: 'Stock Movement', description: 'Complete movement audit trail' },
  { value: 'LOW_STOCK_REPORT', label: 'Low Stock Alert', description: 'Items below reorder levels' },
  { value: 'ITEM_ENTRY_REPORT', label: 'Item Entry Report', description: 'All item entries with costs' },
  { value: 'TRANSFER_REPORT', label: 'Transfer Report', description: 'Inter-warehouse transfers' },
  { value: 'WITHDRAWAL_REPORT', label: 'Withdrawal Report', description: 'Material withdrawals and issuances' },
  { value: 'COST_ANALYSIS', label: 'Cost Analysis', description: 'Cost variance analysis' },
  { value: 'MONTHLY_WEIGHTED_AVERAGE', label: 'Monthly Averages', description: 'Monthly weighted average costs' },
  { value: 'SUPPLIER_PERFORMANCE', label: 'Supplier Performance', description: 'Supplier delivery and cost analysis' },
  { value: 'CATEGORY_ANALYSIS', label: 'Category Analysis', description: 'Inventory analysis by categories' },
]

export function ReportGenerator({ warehouses, suppliers }: ReportGeneratorProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: 'INVENTORY_SUMMARY',
    warehouseId: 'all',
    supplierId: 'all',
    categoryId: 'all',
    dateFrom: '',
    dateTo: '',
    includeZeroStock: false,
  })
  const [isPending, startTransition] = useTransition()
  const [categories, setCategories] = useState<Array<{
    id: string
    name: string
    code: string | null
    parentCategory: { name: string } | null
  }>>([])

  // Load categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const result = await getCategoriesForSelection()
        if (result.success && result.data) {
          setCategories(result.data)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }

    loadCategories()
  }, [])
  const handleGenerateReport = () => {
    startTransition(async () => {
      const result = await generateReport(filters)
      
      if (result.success && result.data) {
        // Create and download CSV
        const csvContent = generateCSV(result.data)
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filters.reportType}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast.success("Report generated and downloaded successfully")
      } else {
        toast.error(result.error || "Failed to generate report")
      }
    })
  }

  const generateCSV = (data: ReportData) => {
    if (!data.records || data.records.length === 0) return ''
    
    // Convert ReportRecord to plain objects using Object.entries
    const plainRecords = data.records.map(record => {
      const plainRecord: Record<string, unknown> = {}
      
      // Use Object.entries to safely extract key-value pairs
      Object.entries(record).forEach(([key, value]) => {
        plainRecord[key] = value
      })
      
      return plainRecord
    })
    
    if (plainRecords.length === 0) return ''
    
    const headers = Object.keys(plainRecords[0])
    const csvRows = [
      headers.join(','),
      ...plainRecords.map(record => 
        headers.map(header => {
          const value = record[header]
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : String(value || '')
        }).join(',')
      )
    ]
    
    return csvRows.join('\n')
  }

  const selectedReportType = REPORT_TYPES.find(type => type.value === filters.reportType)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <FileText className="w-5 h-5 mr-2" />
            Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Report Type Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Report Type</Label>
            <Select
              value={filters.reportType}
              onValueChange={(value) => setFilters(prev => ({ ...prev, reportType: value as ReportType }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedReportType && (
              <p className="text-xs text-gray-600">{selectedReportType.description}</p>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Warehouse</Label>
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
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Supplier</Label>
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
              <Label className="text-sm font-medium">Category</Label>
              <Select
                value={filters.categoryId}
                onValueChange={(value) => setFilters(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center">
                        {category.code && (
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded mr-2">
                            {category.code}
                          </span>
                        )}
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Switch
                id="includeZeroStock"
                checked={filters.includeZeroStock}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeZeroStock: checked }))}
              />
              <Label htmlFor="includeZeroStock" className="text-sm">
                Include zero stock items
              </Label>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleGenerateReport} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}