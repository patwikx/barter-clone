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
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
      currency: 'PHP'
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Low Stock Items</h1>
          <p className="text-gray-600 mt-1">Items that are below their reorder levels</p>
        </div>
        <div className="flex items-center space-x-2">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{filteredItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Shortage Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalShortageValue)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated reorder cost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Warehouses</CardTitle>
            <Warehouse className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {new Set(filteredItems.map(item => item.warehouse.id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Locations with low stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Low Stock Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No low stock items</h3>
              <p className="text-gray-500 text-center">
                All items are above their reorder levels or no items match your search.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Current Stock</TableHead>
                  <TableHead className="text-right">Reorder Level</TableHead>
                  <TableHead className="text-right">Shortage</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Reorder Value</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const shortage = calculateShortage(item.quantity, item.item.reorderLevel)
                  const reorderValue = shortage * item.avgUnitCost

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
                        <div className="font-medium text-red-600">{formatNumber(item.quantity)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatNumber(item.item.reorderLevel || 0)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive">
                          {formatNumber(shortage)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>{formatCurrency(item.avgUnitCost)}</div>
                        <div className="text-xs text-gray-400">
                          Std: {formatCurrency(item.item.standardCost)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        {formatCurrency(reorderValue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>{item.lastUpdated.toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Reorder
                        </Button>
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