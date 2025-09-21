"use client"

import React, { useState, useTransition } from "react"
import {
  ShoppingCart,
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
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  X,
  ChevronDown,
  Users,
  MoreHorizontal,
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
import { getPurchases, type PurchaseWithDetails, type PurchaseStats, type PurchaseFilters } from "@/lib/actions/purchase-actions"
import { PurchaseStatus } from "@prisma/client"
import { toast } from "sonner"
import Link from "next/link"

interface PurchasesViewProps {
  initialPurchases: PurchaseWithDetails[]
  initialStats?: PurchaseStats
  suppliers: Array<{ id: string; name: string }>
}

const getStatusIcon = (status: PurchaseStatus) => {
  switch (status) {
    case PurchaseStatus.PENDING:
      return Clock
    case PurchaseStatus.RECEIVED:
      return CheckCircle
    case PurchaseStatus.PARTIALLY_RECEIVED:
      return Package
    case PurchaseStatus.CANCELLED:
      return XCircle
    default:
      return Clock
  }
}

const getStatusColor = (status: PurchaseStatus) => {
  switch (status) {
    case PurchaseStatus.PENDING:
      return "bg-yellow-100 text-yellow-800"
    case PurchaseStatus.RECEIVED:
      return "bg-green-100 text-green-800"
    case PurchaseStatus.PARTIALLY_RECEIVED:
      return "bg-blue-100 text-blue-800"
    case PurchaseStatus.CANCELLED:
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function PurchasesView({ 
  initialPurchases, 
  initialStats,
  suppliers 
}: PurchasesViewProps) {
  const [purchases, setPurchases] = useState<PurchaseWithDetails[]>(initialPurchases)
  const [stats, setStats] = useState<PurchaseStats | undefined>(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<PurchaseFilters> = {
        search: searchQuery,
        supplierId: selectedSupplier === "all" ? undefined : selectedSupplier,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        dateFrom,
        dateTo
      }

      const result = await getPurchases(filters)
      
      if (result.success) {
        setPurchases(result.data || [])
        setStats(result.stats)
        toast.success("Purchase data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh purchases")
      }
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedSupplier("all")
    setSelectedStatus("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = searchQuery || selectedSupplier !== "all" || selectedStatus !== "all" || dateFrom || dateTo

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Purchase Orders</h1>
            <p className="text-gray-600">Manage purchase orders and supplier transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/dashboard/purchases/create">
                <Plus className="w-4 h-4 mr-2" />
                New Purchase Order
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.totalPurchases)}</p>
                  <p className="text-sm text-gray-500 mt-1">All time purchases</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-sm text-gray-500 mt-1">Avg: {formatCurrency(stats.averageOrderValue)}</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-orange-600">{formatNumber(stats.pendingPurchases)}</p>
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed Orders</p>
                  <p className="text-3xl font-bold text-emerald-600">{formatNumber(stats.receivedPurchases)}</p>
                  <p className="text-sm text-gray-500 mt-1">Successfully received</p>
                </div>
                <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-emerald-600" />
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
                  placeholder="Search orders, suppliers, references..."
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
                    {[searchQuery, selectedSupplier !== "all", selectedStatus !== "all", dateFrom, dateTo].filter(Boolean).length}
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
                  <Label className="text-sm font-semibold text-gray-900 mb-3 block">Supplier</Label>
                  <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="All Suppliers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Suppliers</SelectItem>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{supplier.name}</span>
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
                      {Object.values(PurchaseStatus).map((status) => {
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

        {/* Purchase Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="w-6 h-6 mr-3 text-blue-600" />
              Purchase Orders ({formatNumber(purchases.length)})
            </h2>
          </div>

          {purchases.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <ShoppingCart className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No purchase orders found</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                No orders match your current filters or no purchase data is available.
              </p>
              <Button asChild>
                <Link href="/dashboard/purchases/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Purchase Order
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Purchase Order</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">Supplier</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[140px]">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Total Cost</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Created By</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Approved By</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchases.map((purchase) => {
                    const StatusIcon = getStatusIcon(purchase.status)
                    const createdByName = [purchase.createdBy.firstName, purchase.createdBy.lastName]
                      .filter(Boolean).join(' ') || purchase.createdBy.username
                    const approvedByName = purchase.approvedBy 
                      ? [purchase.approvedBy.firstName, purchase.approvedBy.lastName]
                          .filter(Boolean).join(' ') || purchase.approvedBy.username
                      : null

                    return (
                      <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap max-w-[150px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900 truncate">{purchase.purchaseOrder}</div>
                            <div className="text-sm text-gray-600">
                              {formatNumber(purchase.purchaseItems.length)} items
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[180px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 truncate">{purchase.supplier.name}</div>
                            {purchase.supplier.contactInfo && (
                              <div className="text-sm text-gray-500 truncate">
                                {purchase.supplier.contactInfo}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[140px]">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {purchase.purchaseDate.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                Created {purchase.createdAt.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[140px]">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(purchase.status)} truncate`}>
                            <StatusIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{purchase.status.replace(/_/g, ' ')}</span>
                          </span>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(purchase.totalCost)}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          <div className="text-sm text-gray-900 truncate">{createdByName}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          {approvedByName ? (
                            <div>
                              <div className="text-sm text-gray-900 truncate">{approvedByName}</div>
                              {purchase.approvedAt && (
                                <div className="text-xs text-gray-500 truncate">
                                  {purchase.approvedAt.toLocaleDateString('en-PH', {
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
                                <Link href={`/dashboard/purchases/${purchase.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              {purchase.status === PurchaseStatus.PENDING && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Order
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve Order
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Cancel Order
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