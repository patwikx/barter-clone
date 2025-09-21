"use client"

import React, { useState, useTransition } from "react"
import {
  ArrowRightLeft,
  Search,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Calendar,
  MoreHorizontal,
  X,
  ChevronDown,
  Warehouse,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getTransfers, type TransferWithDetails, type TransferStats, type TransferFilters } from "@/lib/actions/transfer-actions"
import { TransferStatus } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface TransfersViewProps {
  initialTransfers: TransferWithDetails[]
  initialStats?: TransferStats
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

const getStatusIcon = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.PENDING:
      return Clock
    case TransferStatus.IN_TRANSIT:
      return Truck
    case TransferStatus.COMPLETED:
      return CheckCircle
    case TransferStatus.CANCELLED:
      return XCircle
    default:
      return Clock
  }
}

const getStatusColor = (status: TransferStatus) => {
  switch (status) {
    case TransferStatus.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case TransferStatus.IN_TRANSIT:
      return "bg-blue-100 text-blue-800"
    case TransferStatus.COMPLETED:
      return "bg-green-100 text-green-800"
    case TransferStatus.CANCELLED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function TransfersView({ 
  initialTransfers, 
  initialStats,
  warehouses 
}: TransfersViewProps) {
  const [transfers, setTransfers] = useState<TransferWithDetails[]>(initialTransfers)
  const [stats, setStats] = useState<TransferStats | undefined>(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFromWarehouse, setSelectedFromWarehouse] = useState("all")
  const [selectedToWarehouse, setSelectedToWarehouse] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<TransferFilters> = {
        search: searchQuery,
        fromWarehouseId: selectedFromWarehouse === "all" ? undefined : selectedFromWarehouse,
        toWarehouseId: selectedToWarehouse === "all" ? undefined : selectedToWarehouse,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        dateFrom,
        dateTo
      }

      const result = await getTransfers(filters)
      
      if (result.success) {
        setTransfers(result.data || [])
        setStats(result.stats)
        toast.success("Transfer data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh transfers")
      }
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedFromWarehouse("all")
    setSelectedToWarehouse("all")
    setSelectedStatus("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = searchQuery || selectedFromWarehouse !== "all" || selectedToWarehouse !== "all" || selectedStatus !== "all" || dateFrom || dateTo

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stock Transfers</h1>
            <p className="text-gray-600">Manage inventory transfers between warehouses</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/dashboard/transfers/create">
                <Plus className="w-4 h-4 mr-2" />
                New Transfer
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

        {/* Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Transfers</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.totalTransfers)}</p>
                  <p className="text-sm text-gray-500 mt-1">All time transfers</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ArrowRightLeft className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{formatNumber(stats.pendingTransfers)}</p>
                  <p className="text-sm text-gray-500 mt-1">Awaiting approval</p>
                </div>
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-7 h-7 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">In Transit</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.inTransitTransfers)}</p>
                  <p className="text-sm text-gray-500 mt-1">Being transferred</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(stats.completedTransfers)}</p>
                  <p className="text-sm text-gray-500 mt-1">Successfully completed</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-600" />
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
                  placeholder="Search transfers, notes, references..."
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
                    {[searchQuery, selectedFromWarehouse !== "all", selectedToWarehouse !== "all", selectedStatus !== "all", dateFrom, dateTo].filter(Boolean).length}
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
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div>
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">From Warehouse</Label>
                  <Select value={selectedFromWarehouse} onValueChange={setSelectedFromWarehouse}>
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
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">To Warehouse</Label>
                  <Select value={selectedToWarehouse} onValueChange={setSelectedToWarehouse}>
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
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Status</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {Object.values(TransferStatus).map((status) => {
                        const Icon = getStatusIcon(status)
                        return (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center">
                              <Icon className="w-4 h-4 mr-2" />
                              {status.replace(/_/g, ' ')}
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

        {/* Transfers Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ArrowRightLeft className="w-6 h-6 mr-3 text-blue-600" />
              Stock Transfers ({formatNumber(transfers.length)})
            </h2>
          </div>

          {transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ArrowRightLeft className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No transfers found</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                No transfers match your current filters or no transfer data is available.
              </p>
              <Button asChild>
                <Link href="/dashboard/transfers/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Transfer
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[160px]">Transfer Number</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[220px]">From → To</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Status</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Items</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Created By</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Approved By</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfers.map((transfer) => {
                    const StatusIcon = getStatusIcon(transfer.status)
                    const createdByName = [transfer.createdBy.firstName, transfer.createdBy.lastName]
                      .filter(Boolean).join(' ') || transfer.createdBy.username
                    const approvedByName = transfer.approvedBy 
                      ? [transfer.approvedBy.firstName, transfer.approvedBy.lastName]
                          .filter(Boolean).join(' ') || transfer.approvedBy.username
                      : null

                    return (
                      <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap max-w-[160px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900 truncate">{transfer.transferNumber}</div>
                            {transfer.notes && (
                              <div className="text-sm text-gray-600 truncate">
                                {transfer.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[220px]">
                          <div className="flex items-center space-x-2">
                            <div className="text-sm min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{transfer.fromWarehouse.name}</div>
                              {transfer.fromWarehouse.location && (
                                <div className="text-xs text-gray-500 truncate">{transfer.fromWarehouse.location}</div>
                              )}
                            </div>
                            <ArrowRightLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="text-sm min-w-0 flex-1">
                              <div className="font-medium text-gray-900 truncate">{transfer.toWarehouse.name}</div>
                              {transfer.toWarehouse.location && (
                                <div className="text-xs text-gray-500 truncate">{transfer.toWarehouse.location}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[140px]">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {transfer.transferDate.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                Created {transfer.createdAt.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transfer.status)} truncate`}>
                            <StatusIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{transfer.status.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <Package className="w-4 h-4 mr-1 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {transfer.transferItems.length}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          <div className="text-sm text-gray-900 truncate">{createdByName}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          {approvedByName ? (
                            <div>
                              <div className="text-sm text-gray-900 truncate">{approvedByName}</div>
                              {transfer.approvedAt && (
                                <div className="text-xs text-gray-500 truncate">
                                  {transfer.approvedAt.toLocaleDateString('en-PH', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/transfers/${transfer.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {transfer.status === TransferStatus.PENDING && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Transfer
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve Transfer
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Transfer
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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