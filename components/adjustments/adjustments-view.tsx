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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Adjustments</h1>
          <p className="text-gray-600 mt-1">Manage inventory adjustments and physical counts</p>
        </div>
        <div className="flex items-center space-x-2">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Adjustments</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.totalAdjustments)}</div>
              <p className="text-xs text-muted-foreground">
                All time adjustments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Physical Counts</CardTitle>
              <Package className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.physicalCountAdjustments}</div>
              <p className="text-xs text-muted-foreground">
                Cycle counts performed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Damage Reports</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.damageAdjustments}</div>
              <p className="text-xs text-muted-foreground">
                Damage adjustments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impact</CardTitle>
              <RotateCcw className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(Math.abs(stats.totalAdjustmentValue))}</div>
              <p className="text-xs text-muted-foreground">
                Adjustment value impact
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
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
              <Label>Adjustment Type</Label>
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

      {/* Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Adjustments ({adjustments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {adjustments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Settings className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No adjustments found</h3>
              <p className="text-gray-500 text-center mb-6">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Adjustment Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Impact</TableHead>
                  <TableHead>Adjusted By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adjustment) => {
                  const TypeIcon = getAdjustmentTypeIcon(adjustment.adjustmentType)
                  const adjustedByName = [adjustment.adjustedBy.firstName, adjustment.adjustedBy.lastName]
                    .filter(Boolean).join(' ') || adjustment.adjustedBy.username

                  const totalImpact = adjustment.adjustmentItems.reduce((sum, item) => sum + item.totalAdjustment, 0)

                  return (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{adjustment.adjustmentNumber}</div>
                          <div className="text-sm text-gray-500">
                            {adjustment.adjustmentItems.length} item{adjustment.adjustmentItems.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAdjustmentTypeColor(adjustment.adjustmentType)}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {adjustment.adjustmentType.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{adjustment.warehouse.name}</div>
                          {adjustment.warehouse.location && (
                            <div className="text-sm text-gray-500">{adjustment.warehouse.location}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {adjustment.reason}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {adjustment.adjustedAt.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {adjustment.adjustedAt.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-medium ${totalImpact >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalImpact >= 0 ? '+' : ''}{formatCurrency(totalImpact)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{adjustedByName}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/adjustments/${adjustment.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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