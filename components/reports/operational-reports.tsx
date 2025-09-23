"use client"

import React, { useState, useTransition } from "react"
import {
  Target,
  Users,
  Building,
  Download,
  Loader2,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { generateOperationalReport } from "@/lib/actions/operational-reports-actions"

interface OperationalReportsProps {
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
}

const OPERATIONAL_REPORT_TYPES = [
  { value: 'WAREHOUSE_EFFICIENCY', label: 'Warehouse Efficiency', icon: Building },
  { value: 'SUPPLIER_PERFORMANCE', label: 'Supplier Performance', icon: Users },
  { value: 'INVENTORY_TURNOVER', label: 'Inventory Turnover', icon: Package },
  { value: 'OPERATIONAL_SUMMARY', label: 'Operational Summary', icon: Target },
]

export function OperationalReports({ warehouses, suppliers }: OperationalReportsProps) {
  const [warehouseId, setWarehouseId] = useState('all')
  const [supplierId, setSupplierId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleGenerateReport = (reportType: string) => {
    startTransition(async () => {
      const filters = {
        reportType,
        warehouseId,
        supplierId,
        dateFrom,
        dateTo,
      }

      const result = await generateOperationalReport(filters)
      
      if (result.success && result.data) {
        // Generate and download CSV
        const csvContent = generateCSV(result.data)
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${reportType}_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
        
        toast.success("Report generated successfully")
      } else {
        toast.error(result.error || "Failed to generate report")
      }
    })
  }

  const generateCSV = (data: { title: string; records: Array<Record<string, unknown>> }) => {
    if (!data.records || data.records.length === 0) return ''
    
    const headers = Object.keys(data.records[0])
    const csvRows = [
      headers.join(','),
      ...data.records.map(record => 
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
            <Target className="w-5 h-5 mr-2" />
            Operational Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {OPERATIONAL_REPORT_TYPES.map((reportType) => {
          const IconComponent = reportType.icon
          
          return (
            <Card key={reportType.value} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                  {reportType.label}
                </h3>
                
                <p className="text-gray-600 text-xs mb-4">
                  {reportType.value === 'WAREHOUSE_EFFICIENCY' && 'Warehouse performance metrics and KPIs'}
                  {reportType.value === 'SUPPLIER_PERFORMANCE' && 'Supplier delivery and quality metrics'}
                  {reportType.value === 'INVENTORY_TURNOVER' && 'Inventory turnover and velocity analysis'}
                  {reportType.value === 'OPERATIONAL_SUMMARY' && 'Overall operational performance summary'}
                </p>
                
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleGenerateReport(reportType.value)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3 mr-1" />
                  )}
                  Generate
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}