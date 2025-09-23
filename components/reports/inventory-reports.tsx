"use client"

import React, { useState, useTransition } from "react"
import {
  Package,
  AlertTriangle,
  DollarSign,
  Download,
  BarChart3,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { generateReport } from "@/lib/actions/report-generator-actions"
import { ReportFilters, ReportData } from "@/types/report-types"
import { toast } from "sonner"

interface InventoryReportsProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
}

const INVENTORY_REPORT_TYPES = [
  { value: 'INVENTORY_SUMMARY', label: 'Current Stock Summary', icon: Package },
  { value: 'INVENTORY_VALUATION', label: 'Inventory Valuation', icon: DollarSign },
  { value: 'LOW_STOCK_REPORT', label: 'Low Stock Alert', icon: AlertTriangle },
]

export function InventoryReports({ warehouses, suppliers }: InventoryReportsProps) {
  const [selectedReport, setSelectedReport] = useState('INVENTORY_SUMMARY')
  const [warehouseId, setWarehouseId] = useState('all')
  const [supplierId, setSupplierId] = useState('all')
  const [isPending, startTransition] = useTransition()

  const handleGenerateReport = () => {
    startTransition(async () => {
      const filters: ReportFilters = {
        reportType: selectedReport as ReportFilters['reportType'],
        warehouseId,
        supplierId,
        dateFrom: '',
        dateTo: '',
        includeZeroStock: selectedReport === 'INVENTORY_SUMMARY',
      }

      const result = await generateReport(filters)
      
      if (result.success && result.data) {
        // Generate and download CSV
        const csvContent = generateCSV(result.data)
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast.success("Report generated successfully")
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <BarChart3 className="w-5 h-5 mr-2" />
            Inventory Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Report Type</Label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_REPORT_TYPES.map((reportType) => (
                    <SelectItem key={reportType.value} value={reportType.value}>
                      {reportType.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Warehouse</Label>
              <Select value={warehouseId} onValueChange={setWarehouseId}>
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
              <Select value={supplierId} onValueChange={setSupplierId}>
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
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleGenerateReport}
              disabled={isPending}
              className="min-w-[200px]"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Generate {INVENTORY_REPORT_TYPES.find(r => r.value === selectedReport)?.label}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Description Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            {(() => {
              const reportType = INVENTORY_REPORT_TYPES.find(r => r.value === selectedReport)
              const IconComponent = reportType?.icon || Package
              return (
                <>
                  <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {reportType?.label}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {selectedReport === 'INVENTORY_SUMMARY' && 'Generate a comprehensive summary of current stock levels and values across all warehouses. Includes item codes, descriptions, quantities, unit costs, and total values.'}
                      {selectedReport === 'INVENTORY_VALUATION' && 'Detailed inventory valuation report showing different costing methods and their impact on inventory values. Perfect for financial reporting and analysis.'}
                      {selectedReport === 'LOW_STOCK_REPORT' && 'Identify items that have fallen below their reorder levels and require immediate attention. Helps prevent stockouts and maintain optimal inventory levels.'}
                    </p>
                  </div>
                </>
              )
            })()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}