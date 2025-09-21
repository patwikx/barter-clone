"use client"

import React, { useState, useTransition } from "react"
import {
  Settings,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Eye,
  RotateCcw,
  AlertTriangle,
  Package,
  Calendar,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getInventoryAdjustments, type AdjustmentWithDetails, type AdjustmentStats, type AdjustmentFilters } from "@/lib/actions/adjustments-actions"
import { AdjustmentType } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface AdjustmentsViewProps {
  initialAdjustments: AdjustmentWithDetails[]
  initialStats?: AdjustmentStats
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

const getAdjustmentTypeIcon = (type: AdjustmentType) => {
  switch (type) {
    case AdjustmentType.PHYSICAL_COUNT:
      return Package
    case AdjustmentType.DAMAGE:
      return AlertTriangle
    case AdjustmentType.SHRINKAGE:
      return RotateCcw
    case AdjustmentType.FOUND:
      return Package
    case AdjustmentType.CORRECTION:
      return Settings
    case AdjustmentType.REVALUATION:
      return RotateCcw
    default:
      return Settings
  }
}

const getAdjustmentTypeColor = (type: AdjustmentType) => {
  switch (type) {
    case AdjustmentType.PHYSICAL_COUNT:
      return "bg-blue-100 text-blue-800"
    case AdjustmentType.DAMAGE:
      return "bg-red-100 text-red-800"
    case AdjustmentType.SHRINKAGE:
      return "bg-orange-100 text-orange-800"
    case AdjustmentType.FOUND:
      return "bg-green-100 text-green-800"
    case AdjustmentType.CORRECTION:
      return "bg-purple-100 text-purple-800"
    case AdjustmentType.REVALUATION:
      return "bg-indigo-100 text-indigo-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function AdjustmentsView({ 
  initialAdjustments, 
  initialStats,
  warehouses 
}: AdjustmentsViewProps) {
  const [adjustments, setAdjustments] = useState<AdjustmentWithDetails[]>(initialAdjustments)
  const [stats, setStats] = useState<AdjustmentStats | undefined>(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [selectedAdjustmentType, setSelectedAdjustmentType] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isPending, startTransition] = useTransition()
  const [isFilterExpanded, setIsFilterExpanded] = useState(false)

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<AdjustmentFilters> = {
        search: searchQuery,
        warehouseId: selectedWarehouse,
        adjustmentType: selectedAdjustmentType,
        dateFrom,
        dateTo
      }

      const result = await getInventoryAdjustments(filters)
      
      if (result.success) {
        setAdjustments(result.data || [])
        setStats(result.stats)
        toast.success("Adjustment data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh adjustments")
      }
    })
  }

  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWarehouse("all")
    setSelectedAdjustmentType("all")
    setDateFrom("")
    setDateTo("")
    
    startTransition(async () => {
      const result = await getInventoryAdjustments()
      if (result.success) {
        setAdjustments(result.data || [])
        setStats(result.stats)
      }
    })
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Adjustments</h1>
            <p className="text-gray-600">Manage inventory adjustments and physical counts</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/dashboard/adjustments/create">
                <Plus className="w-4 h-4 mr-2" />
                New Adjustment
              </Link>
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

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-xl font-bold text-gray-900 mb-1">{formatNumber(stats.totalAdjustments)}</div>
              <div className="text-sm font-medium text-gray-600">Total Adjustments</div>
              <div className="text-xs text-gray-500 mt-1">All time adjustments</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600 mb-1">{formatNumber(stats.physicalCountAdjustments)}</div>
              <div className="text-sm font-medium text-gray-600">Physical Counts</div>
              <div className="text-xs text-gray-500 mt-1">Cycle counts performed</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="text-xl font-bold text-red-600 mb-1">{formatNumber(stats.damageAdjustments)}</div>
              <div className="text-sm font-medium text-gray-600">Damage Reports</div>
              <div className="text-xs text-gray-500 mt-1">Damage adjustments</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <RotateCcw className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-xl font-bold text-purple-600 mb-1">{formatCurrency(Math.abs(stats.totalAdjustmentValue))}</div>
              <div className="text-sm font-medium text-gray-600">Total Impact</div>
              <div className="text-xs text-gray-500 mt-1">Adjustment value impact</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div 
            className="px-8 py-6 border-b border-gray-200 bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Filter className="w-6 h-6 mr-3 text-blue-600" />
                Filters
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {isFilterExpanded ? 'Collapse' : 'Expand'}
                </span>
                {isFilterExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
          {isFilterExpanded && (
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search adjustments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Warehouse</Label>
                  <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Warehouses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Warehouses</SelectItem>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          <div>
                            <div className="font-medium">{warehouse.name}</div>
                            {warehouse.location && (
                              <div className="text-sm text-gray-500">{warehouse.location}</div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Adjustment Type</Label>
                  <Select value={selectedAdjustmentType} onValueChange={setSelectedAdjustmentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.values(AdjustmentType).map((type) => {
                        const Icon = getAdjustmentTypeIcon(type)
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
                  <Label className="text-sm font-medium text-gray-700">Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Button onClick={handleFilterChange} disabled={isPending}>
                  <Filter className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Adjustments Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-3 text-blue-600" />
              Adjustments ({formatNumber(adjustments.length)})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {adjustments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Settings className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No adjustments found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
                  No adjustments match your current filters or no adjustment data available.
                </p>
                <Button asChild>
                  <Link href="/dashboard/adjustments/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Adjustment
                  </Link>
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Adjustment Number</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Impact</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Adjusted By</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adjustments.map((adjustment) => {
                    const TypeIcon = getAdjustmentTypeIcon(adjustment.adjustmentType)
                    const adjustedByName = [adjustment.adjustedBy.firstName, adjustment.adjustedBy.lastName]
                      .filter(Boolean).join(' ') || adjustment.adjustedBy.username

                    const totalImpact = adjustment.adjustmentItems.reduce((sum, item) => sum + item.totalAdjustment, 0)

                    return (
                      <tr key={adjustment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{adjustment.adjustmentNumber}</div>
                            <div className="text-xs text-gray-500">
                              {formatNumber(adjustment.adjustmentItems.length)} item{adjustment.adjustmentItems.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAdjustmentTypeColor(adjustment.adjustmentType)}`}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {adjustment.adjustmentType.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{adjustment.warehouse.name}</div>
                            {adjustment.warehouse.location && (
                              <div className="text-xs text-gray-500">{adjustment.warehouse.location}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {adjustment.reason}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {adjustment.adjustedAt.toLocaleDateString('en-PH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {adjustment.adjustedAt.toLocaleTimeString('en-PH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className={`text-sm font-semibold ${totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {totalImpact >= 0 ? '+' : ''}{formatCurrency(totalImpact)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{adjustedByName}</div>
                            <div className="text-xs text-gray-500">@{adjustment.adjustedBy.username}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/adjustments/${adjustment.id}`} className="flex items-center">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}