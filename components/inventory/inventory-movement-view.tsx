"use client"

import React, { useState, useTransition } from "react"
import {
  ArrowUpDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Plus,
  Minus,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getInventoryMovements, type InventoryMovementFilters } from "@/lib/actions/inventory-actions"
import { MovementType } from "@prisma/client"
import { toast } from "sonner"

interface InventoryMovement {
  id: string
  movementType: MovementType
  quantity: number
  unitCost: number | null
  totalValue: number | null
  referenceId: string | null
  notes: string | null
  balanceQuantity: number
  balanceValue: number
  createdAt: Date
  item: {
    id: string
    itemCode: string
    description: string
    unitOfMeasure: string
  }
  warehouse: {
    id: string
    name: string
    location: string | null
  }
}

interface InventoryMovementsViewProps {
  initialMovements: InventoryMovement[]
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

// Define inbound movement types as a const assertion to maintain type safety
const INBOUND_MOVEMENT_TYPES = [
  MovementType.PURCHASE_RECEIPT, 
  MovementType.TRANSFER_IN, 
  MovementType.OPENING_BALANCE
] as const

const getMovementIcon = (type: MovementType) => {
  switch (type) {
    case MovementType.PURCHASE_RECEIPT:
      return TrendingUp
    case MovementType.TRANSFER_IN:
      return TrendingUp
    case MovementType.TRANSFER_OUT:
      return TrendingDown
    case MovementType.WITHDRAWAL:
      return Minus
    case MovementType.ADJUSTMENT:
      return RotateCcw
    case MovementType.OPENING_BALANCE:
      return Plus
    case MovementType.REVALUATION:
      return ArrowUpDown
    default:
      return Package
  }
}

const getMovementColor = (type: MovementType) => {
  switch (type) {
    case MovementType.PURCHASE_RECEIPT:
      return "bg-green-100 text-green-800"
    case MovementType.TRANSFER_IN:
      return "bg-blue-100 text-blue-800"
    case MovementType.TRANSFER_OUT:
      return "bg-orange-100 text-orange-800"
    case MovementType.WITHDRAWAL:
      return "bg-red-100 text-red-800"
    case MovementType.ADJUSTMENT:
      return "bg-purple-100 text-purple-800"
    case MovementType.OPENING_BALANCE:
      return "bg-gray-100 text-gray-800"
    case MovementType.REVALUATION:
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Helper function to check if movement type is inbound
const isInboundMovement = (movementType: MovementType): boolean => {
  return (INBOUND_MOVEMENT_TYPES as readonly MovementType[]).includes(movementType)
}

export function InventoryMovementsView({ 
  initialMovements, 
  warehouses 
}: InventoryMovementsViewProps) {
  const [movements, setMovements] = useState<InventoryMovement[]>(initialMovements)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [selectedMovementType, setSelectedMovementType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<InventoryMovementFilters> = {
        search: searchQuery,
        warehouseId: selectedWarehouse,
        movementType: selectedMovementType,
        dateFrom,
        dateTo
      }

      const result = await getInventoryMovements(filters)
      
      if (result.success) {
        setMovements(result.data || [])
        toast.success("Movement data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh movements")
      }
    })
  }

  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWarehouse("all")
    setSelectedMovementType("all")
    setDateFrom("")
    setDateTo("")
    
    startTransition(async () => {
      const result = await getInventoryMovements()
      if (result.success) {
        setMovements(result.data || [])
      }
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Movements</h1>
          <p className="text-gray-600 mt-1">Track all inventory transactions and movements</p>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search movements..."
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
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select value={selectedMovementType} onValueChange={setSelectedMovementType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.values(MovementType).map((type) => {
                    const Icon = getMovementIcon(type)
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center">
                          <Icon className="w-4 h-4 mr-2" />
                          {type.replace(/_/g, ' ')}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
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

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowUpDown className="w-5 h-5 mr-2" />
            Movement History ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowUpDown className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No movements found</h3>
              <p className="text-gray-500 text-center">
                No movements match your current filters or no movement data available.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Balance Qty</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const Icon = getMovementIcon(movement.movementType)
                  const isInbound = isInboundMovement(movement.movementType)

                  return (
                    <TableRow key={movement.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {movement.createdAt.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {movement.createdAt.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getMovementColor(movement.movementType)}>
                          <Icon className="w-3 h-3 mr-1" />
                          {movement.movementType.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.item.itemCode}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {movement.item.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{movement.warehouse.name}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                          {isInbound ? '+' : '-'}{formatNumber(Math.abs(movement.quantity))}
                        </div>
                        <div className="text-xs text-gray-400">
                          {movement.item.unitOfMeasure}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(movement.unitCost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(movement.totalValue)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{formatNumber(movement.balanceQuantity)}</div>
                        <div className="text-xs text-gray-400">
                          {formatCurrency(movement.balanceValue)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {movement.notes || "-"}
                        </div>
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