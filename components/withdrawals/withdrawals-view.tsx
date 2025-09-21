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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Material Withdrawals</h1>
            <p className="text-gray-600">Manage material withdrawal requests and approvals</p>
          </div>
          <div className="flex items-center gap-3">
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Truck className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{formatNumber(stats.totalWithdrawals)}</div>
              <div className="text-sm font-medium text-gray-600">Total Withdrawals</div>
              <div className="text-xs text-gray-500 mt-1">All time withdrawals</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-600 mb-1">{formatNumber(stats.pendingWithdrawals)}</div>
              <div className="text-sm font-medium text-gray-600">Pending</div>
              <div className="text-xs text-gray-500 mt-1">Awaiting approval</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-1">{formatNumber(stats.approvedWithdrawals)}</div>
              <div className="text-sm font-medium text-gray-600">Approved</div>
              <div className="text-xs text-gray-500 mt-1">Ready for processing</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-1">{formatNumber(stats.completedWithdrawals)}</div>
              <div className="text-sm font-medium text-gray-600">Completed</div>
              <div className="text-xs text-gray-500 mt-1">Successfully completed</div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600 mb-1">{formatNumber(stats.rejectedWithdrawals)}</div>
              <div className="text-sm font-medium text-gray-600">Rejected</div>
              <div className="text-xs text-gray-500 mt-1">Rejected requests</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Filter className="w-6 h-6 mr-3 text-blue-600" />
              Filters
            </h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Search</Label>
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
                <Label className="text-sm font-medium text-gray-700">Status</Label>
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
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Truck className="w-6 h-6 mr-3 text-blue-600" />
              Withdrawals ({formatNumber(withdrawals.length)})
            </h3>
          </div>
          <div className="overflow-x-auto">
            {withdrawals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                  <Truck className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No withdrawals found</h3>
                <p className="text-gray-500 text-center mb-8 max-w-sm">
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
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Withdrawal Number</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Requested By</th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Approved By</th>
                    <th className="text-center py-3 px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
                      <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{withdrawal.withdrawalNumber}</div>
                            <div className="text-xs text-gray-500">
                              {formatNumber(withdrawal.withdrawalItems.length)} item{withdrawal.withdrawalItems.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">{withdrawal.warehouse.name}</div>
                            {withdrawal.warehouse.location && (
                              <div className="text-xs text-gray-500">{withdrawal.warehouse.location}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {withdrawal.purpose || "-"}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">
                                {withdrawal.withdrawalDate.toLocaleDateString('en-PH', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                Created {withdrawal.createdAt.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {withdrawal.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(totalValue)}
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900">{requestedByName}</div>
                            <div className="text-xs text-gray-500">@{withdrawal.requestedBy.username}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          {approvedByName ? (
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900">{approvedByName}</div>
                              <div className="text-xs text-gray-500">@{withdrawal.approvedBy?.username}</div>
                              {withdrawal.approvedAt && (
                                <div className="text-xs text-gray-400 mt-1">
                                  {withdrawal.approvedAt.toLocaleDateString('en-PH', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
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
                                <Link href={`/dashboard/withdrawals/${withdrawal.id}`} className="flex items-center">
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
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject Withdrawal
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}