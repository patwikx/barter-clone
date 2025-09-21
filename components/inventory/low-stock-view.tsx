"use client"

import React, { useState, useTransition } from "react"
import {
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  ShoppingCart,
  Package,
  TrendingDown,
  Warehouse,
  Filter,
  X,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getLowStockItems } from "@/lib/actions/inventory-actions"
import { toast } from "sonner"

interface LowStockItem {
  id: string
  quantity: number
  totalValue: number
  avgUnitCost: number
  lastUpdated: Date
  item: {
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
    reorderLevel: number | null
    standardCost: number
    supplier: {
      id: string
      name: string
    }
  }
  warehouse: {
    id: string
    name: string
    location: string | null
  }
}

interface LowStockViewProps {
  initialLowStockItems: LowStockItem[]
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

export function LowStockView({ 
  initialLowStockItems, 
  warehouses 
}: LowStockViewProps) {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>(initialLowStockItems)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getLowStockItems(selectedWarehouse === "all" ? undefined : selectedWarehouse)
      
      if (result.success) {
        setLowStockItems(result.data || [])
        toast.success("Low stock data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh low stock items")
      }
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWarehouse("all")
  }

  const hasActiveFilters = searchQuery || selectedWarehouse !== "all"

  const filteredItems = lowStockItems.filter((item) => {
    const matchesSearch = 
      item.item.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

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

  const calculateShortage = (current: number, reorder: number | null) => {
    if (!reorder) return 0
    return Math.max(0, reorder - current)
  }

  const totalShortageValue = filteredItems.reduce((sum, item) => {
    const shortage = calculateShortage(item.quantity, item.item.reorderLevel)
    return sum + (shortage * item.avgUnitCost)
  }, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Low Stock Items</h1>
            <p className="text-gray-600">Items that are below their reorder levels</p>
          </div>
          <div className="flex items-center gap-3">
            <Button>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Create Purchase Orders
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Low Stock Items</p>
                <p className="text-3xl font-bold text-amber-600">{filteredItems.length}</p>
                <p className="text-sm text-gray-500 mt-1">Need immediate attention</p>
              </div>
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Shortage Value</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(totalShortageValue)}</p>
                <p className="text-sm text-gray-500 mt-1">Estimated reorder cost</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Affected Warehouses</p>
                <p className="text-3xl font-bold text-blue-600">
                  {new Set(filteredItems.map(item => item.warehouse.id)).size}
                </p>
                <p className="text-sm text-gray-500 mt-1">Locations with low stock</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Warehouse className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between gap-6">
            {/* Search */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search items, codes, descriptions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base border-gray-300"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-3">
              <Button 
                variant={showFilters ? "default" : "outline"} 
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 px-6"
              >
                <Filter className="w-5 h-5 mr-2" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[searchQuery, selectedWarehouse !== "all"].filter(Boolean).length}
                  </Badge>
                )}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>

              <Button onClick={handleRefresh} disabled={isPending} className="h-12 px-6">
                Apply
              </Button>
              
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="h-12 px-4">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Warehouse</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div className="flex items-center">
                            <Warehouse className="w-4 h-4 mr-2 text-gray-500" />
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
            </div>
          )}
        </div>

        {/* Low Stock Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <AlertTriangle className="w-6 h-6 mr-3 text-amber-600" />
              Low Stock Items ({formatNumber(filteredItems.length)})
            </h2>
          </div>

          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No low stock items</h3>
              <p className="text-gray-500 text-center max-w-md">
                All items are above their reorder levels or no items match your search.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Item Details</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">UOM</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Shortage</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Value</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredItems.map((item) => {
                    const shortage = calculateShortage(item.quantity, item.item.reorderLevel)
                    const reorderValue = shortage * item.avgUnitCost

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{item.item.itemCode}</div>
                            <div className="text-sm text-gray-600">{item.item.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.item.unitOfMeasure}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{item.warehouse.name}</div>
                            {item.warehouse.location && (
                              <div className="text-sm text-gray-500">{item.warehouse.location}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item.item.supplier.name}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-red-600">{formatNumber(item.quantity)}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">{formatNumber(item.item.reorderLevel || 0)}</div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {formatNumber(shortage)}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(item.avgUnitCost)}</div>
                            <div className="text-xs text-gray-500">Std: {formatCurrency(item.item.standardCost)}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-semibold text-red-600">
                          {formatCurrency(reorderValue)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                          {item.lastUpdated.toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <Button size="sm" variant="outline" className="text-xs">
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Reorder
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}