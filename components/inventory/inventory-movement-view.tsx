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
  X,
  ChevronDown,
  Activity,
  BarChart3,
  Warehouse,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
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
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<InventoryMovementFilters> = {
        search: searchQuery,
        warehouseId: selectedWarehouse === "all" ? undefined : selectedWarehouse,
        movementType: selectedMovementType === "all" ? undefined : selectedMovementType,
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

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWarehouse("all")
    setSelectedMovementType("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = searchQuery || selectedWarehouse !== "all" || selectedMovementType !== "all" || dateFrom || dateTo

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "-"
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

  // Calculate summary statistics
  const totalInboundMovements = movements.filter(m => isInboundMovement(m.movementType)).length
  const totalOutboundMovements = movements.filter(m => !isInboundMovement(m.movementType)).length
  const totalValueIn = movements
    .filter(m => isInboundMovement(m.movementType))
    .reduce((sum, m) => sum + (m.totalValue || 0), 0)
  const totalValueOut = movements
    .filter(m => !isInboundMovement(m.movementType))
    .reduce((sum, m) => sum + Math.abs(m.totalValue || 0), 0)
  const affectedWarehouses = new Set(movements.map(m => m.warehouse.id)).size

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Movements</h1>
            <p className="text-gray-600">Track all inventory transactions and movements</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Movements</p>
                <p className="text-3xl font-bold text-blue-600">{formatNumber(movements.length)}</p>
                <p className="text-sm text-gray-500 mt-1">All transactions</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Activity className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Inbound Value</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(totalValueIn)}</p>
                <p className="text-sm text-gray-500 mt-1">{formatNumber(totalInboundMovements)} movements</p>
              </div>
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Outbound Value</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(totalValueOut)}</p>
                <p className="text-sm text-gray-500 mt-1">{formatNumber(totalOutboundMovements)} movements</p>
              </div>
              <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-7 h-7 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Warehouses</p>
                <p className="text-3xl font-bold text-purple-600">{formatNumber(affectedWarehouses)}</p>
                <p className="text-sm text-gray-500 mt-1">Locations with activity</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Warehouse className="w-7 h-7 text-purple-600" />
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
                  placeholder="Search movements, items, references..."
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
                    {[searchQuery, selectedWarehouse !== "all", selectedMovementType !== "all", dateFrom, dateTo].filter(Boolean).length}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Movement Type</Label>
                  <Select value={selectedMovementType} onValueChange={setSelectedMovementType}>
                    <SelectTrigger className="h-11">
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

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Movements Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-3 text-blue-600" />
              Movement History ({formatNumber(movements.length)})
            </h2>
          </div>

          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ArrowUpDown className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No movements found</h3>
              <p className="text-gray-500 text-center max-w-md">
                No movements match your current filters or no movement data is available.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Date & Time</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">Movement Type</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[200px]">Item Details</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Warehouse</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Unit Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Total Value</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Balance</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {movements.map((movement) => {
                    const Icon = getMovementIcon(movement.movementType)
                    const isInbound = isInboundMovement(movement.movementType)

                    return (
                      <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {movement.createdAt.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {movement.createdAt.toLocaleTimeString('en-PH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[140px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMovementColor(movement.movementType)} truncate`}>
                            <Icon className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{movement.movementType.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap max-w-[200px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900 truncate">{movement.item.itemCode}</div>
                            <div className="text-sm text-gray-600 truncate">{movement.item.description}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap max-w-[150px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 truncate">{movement.warehouse.name}</div>
                            {movement.warehouse.location && (
                              <div className="text-sm text-gray-500 truncate">{movement.warehouse.location}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className={`text-sm font-semibold ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                            {isInbound ? '+' : '-'}{formatNumber(Math.abs(movement.quantity))}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{movement.item.unitOfMeasure}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(movement.unitCost)}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className={`text-sm font-semibold ${isInbound ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(movement.totalValue)}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="flex flex-col items-end">
                            <div className="text-sm font-medium text-gray-900">{formatNumber(movement.balanceQuantity)}</div>
                            <div className="text-xs text-gray-500">{formatCurrency(movement.balanceValue)}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[150px]">
                          <div className="text-sm text-gray-600 truncate">
                            {movement.notes || "-"}
                          </div>
                          {movement.referenceId && (
                            <div className="text-xs text-gray-400 mt-1 truncate">
                              Ref: {movement.referenceId}
                            </div>
                          )}
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