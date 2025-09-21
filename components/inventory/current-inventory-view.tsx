"use client"

import React, { useState, useTransition } from "react"
import {
  Package,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingDown,
  DollarSign,
  Warehouse,
  AlertTriangle,
  BarChart3,
  X,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getCurrentInventory, type CurrentInventoryItem, type InventoryStats, type InventoryFilters } from "@/lib/actions/inventory-actions"
import { toast } from "sonner"

interface CurrentInventoryViewProps {
  initialInventory: CurrentInventoryItem[]
  initialStats?: InventoryStats
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
}

export function CurrentInventoryView({ 
  initialInventory, 
  initialStats,
  warehouses,
  suppliers 
}: CurrentInventoryViewProps) {
  const [inventory, setInventory] = useState<CurrentInventoryItem[]>(initialInventory)
  const [stats, setStats] = useState<InventoryStats | undefined>(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [showLowStock, setShowLowStock] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<InventoryFilters> = {
        search: searchQuery,
        warehouseId: selectedWarehouse === "all" ? undefined : selectedWarehouse,
        supplierId: selectedSupplier === "all" ? undefined : selectedSupplier,
        lowStock: showLowStock
      }

      const result = await getCurrentInventory(filters)
      
      if (result.success) {
        setInventory(result.data || [])
        setStats(result.stats)
        toast.success("Inventory data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh inventory")
      }
    })
  }

  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWarehouse("all")
    setSelectedSupplier("all")
    setShowLowStock(false)
    
    startTransition(async () => {
      const result = await getCurrentInventory()
      if (result.success) {
        setInventory(result.data || [])
        setStats(result.stats)
      }
    })
  }

  const hasActiveFilters = searchQuery || selectedWarehouse !== "all" || selectedSupplier !== "all" || showLowStock

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Current Inventory</h1>
            <p className="text-gray-600">Real-time inventory levels across all warehouses</p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Items</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalItems)}</p>
                  <p className="text-sm text-gray-500 mt-1">Across {stats.warehouseCount} warehouses</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Package className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-sm text-gray-500 mt-1">Avg: {formatCurrency(stats.averageValue)}</p>
                </div>
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Low Stock</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.lowStockItems}</p>
                  <p className="text-sm text-gray-500 mt-1">Need reordering</p>
                </div>
                <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-7 h-7 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Out of Stock</p>
                  <p className="text-3xl font-bold text-red-600">{stats.outOfStockItems}</p>
                  <p className="text-sm text-gray-500 mt-1">Immediate attention</p>
                </div>
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        )}

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
                    {[searchQuery, selectedWarehouse !== "all", selectedSupplier !== "all", showLowStock].filter(Boolean).length}
                  </Badge>
                )}
                <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>

              <Button onClick={handleFilterChange} disabled={isPending} className="h-12 px-6">
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Supplier</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Suppliers" />
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

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Stock Status</Label>
                  <div className="flex items-center space-x-3 h-11 px-4 py-2 border border-gray-300 rounded-md bg-white">
                    <Switch 
                      id="low-stock-filter" 
                      checked={showLowStock} 
                      onCheckedChange={setShowLowStock}
                    />
                    <Label htmlFor="low-stock-filter" className="text-sm font-medium">
                      Show low stock items only
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-gray-600" />
              Inventory Items ({formatNumber(inventory.length)})
            </h2>
          </div>

          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No inventory found</h3>
              <p className="text-gray-500 text-center max-w-md">
                No items match your current filters. Try adjusting your search criteria or clear all filters.
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
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory.map((item) => {
                    const isLowStock = item.item.reorderLevel && item.quantity <= item.item.reorderLevel
                    const isOutOfStock = item.quantity === 0

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
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-semibold text-gray-900">{formatNumber(item.quantity)}</div>
                            {item.item.reorderLevel && (
                              <div className="text-xs text-gray-500">Reorder: {formatNumber(item.item.reorderLevel)}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(item.avgUnitCost)}</div>
                            <div className="text-xs text-gray-500">Std: {formatCurrency(item.item.standardCost)}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                          {formatCurrency(item.totalValue)}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              <svg className="w-1.5 h-1.5 mr-1.5 fill-current" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <svg className="w-1.5 h-1.5 mr-1.5 fill-current" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-1.5 h-1.5 mr-1.5 fill-current" viewBox="0 0 8 8">
                                <circle cx={4} cy={4} r={3} />
                              </svg>
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-sm text-gray-500">
                          {item.lastUpdated.toLocaleDateString('en-PH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
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