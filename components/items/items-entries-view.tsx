"use client"

import React, { useState, useTransition } from "react"
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  X,
  ChevronDown,
  Building,
  Truck,
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
import { getItemEntries, type ItemEntryWithDetails, type ItemEntryStats, type ItemEntryFilters } from "@/lib/actions/item-entry-actions"
import { toast } from "sonner"
import Link from "next/link"

interface ItemEntriesViewProps {
  initialEntries: ItemEntryWithDetails[]
  initialStats?: ItemEntryStats
  warehouses: Array<{ id: string; name: string; location: string | null }>
  suppliers: Array<{ id: string; name: string }>
}

export function ItemEntriesView({ 
  initialEntries, 
  initialStats,
  warehouses,
  suppliers 
}: ItemEntriesViewProps) {
  const [entries, setEntries] = useState<ItemEntryWithDetails[]>(initialEntries)
  const [stats, setStats] = useState<ItemEntryStats | undefined>(initialStats)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedWarehouse, setSelectedWarehouse] = useState("all")
  const [selectedSupplier, setSelectedSupplier] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const filters: Partial<ItemEntryFilters> = {
        search: searchQuery,
        warehouseId: selectedWarehouse === "all" ? undefined : selectedWarehouse,
        supplierId: selectedSupplier === "all" ? undefined : selectedSupplier,
        dateFrom,
        dateTo
      }

      const result = await getItemEntries(filters)
      
      if (result.success) {
        setEntries(result.data || [])
        setStats(result.stats)
        toast.success("Item entries refreshed")
      } else {
        toast.error(result.error || "Failed to refresh item entries")
      }
    })
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedWarehouse("all")
    setSelectedSupplier("all")
    setDateFrom("")
    setDateTo("")
  }

  const hasActiveFilters = searchQuery || selectedWarehouse !== "all" || selectedSupplier !== "all" || dateFrom || dateTo

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Item Entries</h1>
            <p className="text-gray-600">Record and manage incoming inventory items</p>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="/dashboard/item-entries/create">
                <Plus className="w-4 h-4 mr-2" />
                New Item Entry
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
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Entries</p>
                  <p className="text-3xl font-bold text-blue-600">{formatNumber(stats.totalEntries)}</p>
                  <p className="text-sm text-gray-500 mt-1">All time entries</p>
                </div>
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Plus className="w-7 h-7 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Value</p>
                  <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</p>
                  <p className="text-sm text-gray-500 mt-1">Avg: {formatCurrency(stats.averageEntryValue)}</p>
                </div>
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-7 h-7 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">This Month</p>
                  <p className="text-3xl font-bold text-purple-600">{formatNumber(stats.thisMonthEntries)}</p>
                  <p className="text-sm text-gray-500 mt-1">Monthly entries</p>
                </div>
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Monthly Value</p>
                  <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.thisMonthValue)}</p>
                  <p className="text-sm text-gray-500 mt-1">This month total</p>
                </div>
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Package className="w-7 h-7 text-orange-600" />
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
                  placeholder="Search entries, items, references..."
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
                    {[searchQuery, selectedWarehouse !== "all", selectedSupplier !== "all", dateFrom, dateTo].filter(Boolean).length}
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
                            <Building className="w-4 h-4 mr-2 text-gray-500" />
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
                            <Truck className="w-4 h-4 mr-2 text-gray-500" />
                            <span>{supplier.name}</span>
                          </div>
                        </SelectItem>
                      ))}
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

        {/* Item Entries Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Plus className="w-6 h-6 mr-3 text-blue-600" />
              Item Entries ({formatNumber(entries.length)})
            </h2>
          </div>

          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Plus className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No item entries found</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                No entries match your current filters or no entry data is available.
              </p>
              <Button asChild>
                <Link href="/dashboard/item-entries/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Item Entry
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[180px]">Item Details</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Warehouse</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[150px]">Supplier</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[100px]">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Landed Cost</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Total Value</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Reference</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Entry Date</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[120px]">Created By</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => {
                    const createdByName = [entry.createdBy.firstName, entry.createdBy.lastName]
                      .filter(Boolean).join(' ') || entry.createdBy.username

                    return (
                      <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4 whitespace-nowrap max-w-[180px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900 truncate">{entry.item.itemCode}</div>
                            <div className="text-sm text-gray-600 truncate">{entry.item.description}</div>
                            <div className="text-xs text-gray-500">UOM: {entry.item.unitOfMeasure}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[150px]">
                          <div className="flex flex-col">
                            <div className="text-sm font-medium text-gray-900 truncate">{entry.warehouse.name}</div>
                            {entry.warehouse.location && (
                              <div className="text-sm text-gray-500 truncate">{entry.warehouse.location}</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[150px]">
                          <div className="text-sm text-gray-900 truncate">{entry.supplier.name}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatNumber(entry.quantity)}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="text-sm font-medium text-gray-900">{formatCurrency(entry.landedCost)}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900">{formatCurrency(entry.totalValue)}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          <div className="text-sm text-gray-600 truncate">
                            {entry.purchaseReference || "-"}
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {entry.entryDate.toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {entry.entryDate.toLocaleTimeString('en-PH', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap max-w-[120px]">
                          <div className="text-sm text-gray-900 truncate">{createdByName}</div>
                          <div className="text-xs text-gray-500 truncate">@{entry.createdBy.username}</div>
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
                                <Link href={`/dashboard/item-entries/${entry.id}`}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Entry
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Entry
                              </DropdownMenuItem>
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