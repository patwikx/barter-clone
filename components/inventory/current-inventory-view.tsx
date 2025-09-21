"use client"

import React, { useState, useTransition } from "react"
import {
  Package,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Warehouse,
  AlertTriangle,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<InventoryFilters> = {
        search: searchQuery,
        warehouseId: selectedWarehouse,
        supplierId: selectedSupplier,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Current Inventory</h1>
          <p className="text-gray-600 mt-1">Real-time inventory levels across all warehouses</p>
        </div>
        <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalItems)}</div>
              <p className="text-xs text-muted-foreground">
                Across {stats.warehouseCount} warehouses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatCurrency(stats.averageValue)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
              <TrendingDown className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Need reordering
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</div>
              <p className="text-xs text-muted-foreground">
                Immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="All Warehouses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      <div className="flex items-center">
                        <Warehouse className="w-4 h-4 mr-2" />
                        {warehouse.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Switch 
                  id="low-stock" 
                  checked={showLowStock} 
                  onCheckedChange={setShowLowStock}
                />
                <Label htmlFor="low-stock" className="text-sm">
                  Low stock only
                </Label>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button onClick={handleFilterChange} disabled={isPending}>
              Apply Filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Inventory Items ({inventory.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {inventory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory found</h3>
              <p className="text-gray-500 text-center">
                No items match your current filters or no inventory data available.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory.map((item) => {
                  const isLowStock = item.item.reorderLevel && item.quantity <= item.item.reorderLevel
                  const isOutOfStock = item.quantity === 0

                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.item.itemCode}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {item.item.description}
                          </div>
                          <div className="text-xs text-gray-400">
                            UOM: {item.item.unitOfMeasure}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.warehouse.name}</div>
                          {item.warehouse.location && (
                            <div className="text-sm text-gray-500">{item.warehouse.location}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.item.supplier.name}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatNumber(item.quantity)}</div>
                        {item.item.reorderLevel && (
                          <div className="text-xs text-gray-400">
                            Reorder: {formatNumber(item.item.reorderLevel)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div>{formatCurrency(item.avgUnitCost)}</div>
                        <div className="text-xs text-gray-400">
                          Std: {formatCurrency(item.item.standardCost)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalValue)}
                      </TableCell>
                      <TableCell>
                        {isOutOfStock ? (
                          <Badge variant="destructive">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Out of Stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge className="bg-orange-100 text-orange-800">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            In Stock
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {item.lastUpdated.toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}