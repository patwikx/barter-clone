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
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<TransferFilters> = {
        search: searchQuery,
        fromWarehouseId: selectedFromWarehouse,
        toWarehouseId: selectedToWarehouse,
        status: selectedStatus,
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

  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedFromWarehouse("all")
    setSelectedToWarehouse("all")
    setSelectedStatus("all")
    setDateFrom("")
    setDateTo("")
    
    startTransition(async () => {
      const result = await getTransfers()
      if (result.success) {
        setTransfers(result.data || [])
        setStats(result.stats)
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Transfers</h1>
          <p className="text-gray-600 mt-1">Manage inventory transfers between warehouses</p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTransfers}</div>
              <p className="text-xs text-muted-foreground">
                All time transfers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingTransfers}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Transit</CardTitle>
              <Truck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inTransitTransfers}</div>
              <p className="text-xs text-muted-foreground">
                Being transferred
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedTransfers}</div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
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
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search transfers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>From Warehouse</Label>
              <Select value={selectedFromWarehouse} onValueChange={setSelectedFromWarehouse}>
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
              <Label>To Warehouse</Label>
              <Select value={selectedToWarehouse} onValueChange={setSelectedToWarehouse}>
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
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
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

      {/* Transfers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            Transfers ({transfers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowRightLeft className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transfers found</h3>
              <p className="text-gray-500 text-center mb-6">
                No transfers match your current filters or no transfer data available.
              </p>
              <Button asChild>
                <Link href="/dashboard/transfers/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Transfer
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transfer Number</TableHead>
                  <TableHead>From → To</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transfers.map((transfer) => {
                  const StatusIcon = getStatusIcon(transfer.status)
                  const createdByName = [transfer.createdBy.firstName, transfer.createdBy.lastName]
                    .filter(Boolean).join(' ') || transfer.createdBy.username
                  const approvedByName = transfer.approvedBy 
                    ? [transfer.approvedBy.firstName, transfer.approvedBy.lastName]
                        .filter(Boolean).join(' ') || transfer.approvedBy.username
                    : null

                  return (
                    <TableRow key={transfer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transfer.transferNumber}</div>
                          {transfer.notes && (
                            <div className="text-sm text-gray-500 max-w-xs truncate">
                              {transfer.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">
                            <div className="font-medium">{transfer.fromWarehouse.name}</div>
                            {transfer.fromWarehouse.location && (
                              <div className="text-xs text-gray-500">{transfer.fromWarehouse.location}</div>
                            )}
                          </div>
                          <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                          <div className="text-sm">
                            <div className="font-medium">{transfer.toWarehouse.name}</div>
                            {transfer.toWarehouse.location && (
                              <div className="text-xs text-gray-500">{transfer.toWarehouse.location}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {transfer.transferDate.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created {transfer.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transfer.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {transfer.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transfer.transferItems.length} item{transfer.transferItems.length !== 1 ? 's' : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{createdByName}</div>
                      </TableCell>
                      <TableCell>
                        {approvedByName ? (
                          <div>
                            <div className="text-sm">{approvedByName}</div>
                            {transfer.approvedAt && (
                              <div className="text-xs text-gray-500">
                                {transfer.approvedAt.toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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