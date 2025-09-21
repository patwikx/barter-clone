"use client"

import React, { useState, useTransition } from "react"
import {
  Truck,
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
  AlertCircle,
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
import { getWithdrawals, type WithdrawalWithDetails, type WithdrawalStats, type WithdrawalFilters } from "@/lib/actions/withdrawal-actions"
import { WithdrawalStatus } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface WithdrawalsViewProps {
  initialWithdrawals: WithdrawalWithDetails[]
  initialStats?: WithdrawalStats
  warehouses: Array<{ id: string; name: string; location: string | null }>
}

const getStatusIcon = (status: WithdrawalStatus) => {
  switch (status) {
    case WithdrawalStatus.PENDING:
      return Clock
    case WithdrawalStatus.APPROVED:
      return CheckCircle
    case WithdrawalStatus.COMPLETED:
      return CheckCircle
    case WithdrawalStatus.REJECTED:
      return XCircle
    default:
      return Clock
  }
}

const getStatusColor = (status: WithdrawalStatus) => {
  switch (status) {
    case WithdrawalStatus.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case WithdrawalStatus.APPROVED:
      return "bg-blue-100 text-blue-800"
    case WithdrawalStatus.COMPLETED:
      return "bg-green-100 text-green-800"
    case WithdrawalStatus.REJECTED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function WithdrawalsView({ 
  initialWithdrawals, 
  initialStats,
  warehouses 
}: WithdrawalsViewProps) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalWithDetails[]>(initialWithdrawals)
  const [stats, setStats] = useState<WithdrawalStats | undefined>(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<WithdrawalFilters> = {
        search: searchQuery,
        warehouseId: selectedWarehouse,
        status: selectedStatus,
        dateFrom,
        dateTo
      }

      const result = await getWithdrawals(filters)
      
      if (result.success) {
        setWithdrawals(result.data || [])
        setStats(result.stats)
        toast.success("Withdrawal data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh withdrawals")
      }
    })
  }

  const handleFilterChange = () => {
    handleRefresh()
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWarehouse("all")
    setSelectedStatus("all")
    setDateFrom("")
    setDateTo("")
    
    startTransition(async () => {
      const result = await getWithdrawals()
      if (result.success) {
        setWithdrawals(result.data || [])
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Material Withdrawals</h1>
          <p className="text-gray-600 mt-1">Manage material withdrawal requests and approvals</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/dashboard/withdrawals/create">
              <Plus className="w-4 h-4 mr-2" />
              New Withdrawal
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWithdrawals}</div>
              <p className="text-xs text-muted-foreground">
                All time withdrawals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.pendingWithdrawals}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.approvedWithdrawals}</div>
              <p className="text-xs text-muted-foreground">
                Ready for processing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedWithdrawals}</div>
              <p className="text-xs text-muted-foreground">
                Successfully completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejectedWithdrawals}</div>
              <p className="text-xs text-muted-foreground">
                Rejected requests
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
                  placeholder="Search withdrawals..."
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
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.values(WithdrawalStatus).map((status) => {
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

      {/* Withdrawals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Withdrawals ({withdrawals.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No withdrawals found</h3>
              <p className="text-gray-500 text-center mb-6">
                No withdrawals match your current filters or no withdrawal data available.
              </p>
              <Button asChild>
                <Link href="/dashboard/withdrawals/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Withdrawal
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Withdrawal Number</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => {
                  const StatusIcon = getStatusIcon(withdrawal.status)
                  const requestedByName = [withdrawal.requestedBy.firstName, withdrawal.requestedBy.lastName]
                    .filter(Boolean).join(' ') || withdrawal.requestedBy.username
                  const approvedByName = withdrawal.approvedBy 
                    ? [withdrawal.approvedBy.firstName, withdrawal.approvedBy.lastName]
                        .filter(Boolean).join(' ') || withdrawal.approvedBy.username
                    : null

                  const totalValue = withdrawal.withdrawalItems.reduce((sum, item) => sum + item.totalValue, 0)

                  return (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{withdrawal.withdrawalNumber}</div>
                          <div className="text-sm text-gray-500">
                            {withdrawal.withdrawalItems.length} item{withdrawal.withdrawalItems.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{withdrawal.warehouse.name}</div>
                          {withdrawal.warehouse.location && (
                            <div className="text-sm text-gray-500">{withdrawal.warehouse.location}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600 max-w-xs truncate">
                          {withdrawal.purpose || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium">
                              {withdrawal.withdrawalDate.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Created {withdrawal.createdAt.toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(withdrawal.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {withdrawal.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(totalValue)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{requestedByName}</div>
                      </TableCell>
                      <TableCell>
                        {approvedByName ? (
                          <div>
                            <div className="text-sm">{approvedByName}</div>
                            {withdrawal.approvedAt && (
                              <div className="text-xs text-gray-500">
                                {withdrawal.approvedAt.toLocaleDateString()}
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
                              <Link href={`/dashboard/withdrawals/${withdrawal.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {withdrawal.status === WithdrawalStatus.PENDING && (
                              <>
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Withdrawal
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Approve Withdrawal
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject Withdrawal
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