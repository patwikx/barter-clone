"use client"

import React, { useState, useTransition } from "react"
import {
  Package,
  ArrowRightLeft,
  Truck,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Calendar,
  Clock,
  TrendingUp,
  Activity,
  BarChart3,
  CheckCircle,
  XCircle,
  Eye,
  ArrowUpRight,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { getDashboardStats, type DashboardStats } from "@/lib/actions/dashboard-actions"
import { toast } from "sonner"
import Link from "next/link"

interface DashboardViewProps {
  initialStats?: DashboardStats
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'ITEM_ENTRY':
      return Plus
    case 'TRANSFER':
      return ArrowRightLeft
    case 'WITHDRAWAL':
      return Truck
    case 'ADJUSTMENT':
      return Package
    default:
      return Package
  }
}

const getStatusVariant = (status: string): { className: string; icon: React.ElementType } => {
  switch (status.toLowerCase()) {
    case 'in_transit':
      return { className: "bg-blue-50 text-blue-700 border-blue-200", icon: Activity }
    case 'completed':
      return { className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle }
    case 'cancelled':
      return { className: "bg-red-50 text-red-700 border-red-200", icon: XCircle }
    default:
      return { className: "bg-slate-50 text-slate-700 border-slate-200", icon: Activity }
  }
}

export function DashboardView({ initialStats }: DashboardViewProps) {
  const [stats, setStats] = useState<DashboardStats | undefined>(initialStats)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getDashboardStats()
      
      if (result.success) {
        setStats(result.data)
        toast.success("Dashboard data refreshed")
      } else {
        toast.error(result.error || "Failed to refresh dashboard")
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
            <BarChart3 className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900">Loading Dashboard</h2>
            <p className="text-sm text-slate-600">Retrieving your warehouse analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  const stockHealthPercentage = stats.inventory.totalItems > 0 
    ? ((stats.inventory.totalItems - stats.inventory.lowStockItems - stats.inventory.outOfStockItems) / stats.inventory.totalItems) * 100 
    : 100

  // Calculate active operations based on simplified workflow
  const activeOperations = stats.transfers.inTransitTransfers

  return (
    <div className="space-y-8 p-8 bg-slate-50/50 min-h-screen">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Warehouse Operations Dashboard
          </h1>
          <p className="text-slate-600 max-w-2xl">
            Monitor key performance indicators and manage your inventory operations from this centralized command center.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleRefresh} 
          disabled={isPending}
          className="shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-600">Total Inventory Value</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.inventory.totalValue)}
                </p>
                <p className="text-xs text-slate-500">{formatNumber(stats.inventory.totalItems)} items • {stats.inventory.warehouseCount} locations</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-600">Stock Health</p>
                <p className="text-xl font-bold text-slate-900">
                  {stockHealthPercentage.toFixed(1)}%
                </p>
                <div className="space-y-1">
                  <Progress value={stockHealthPercentage} className="h-1.5" />
                  <p className="text-xs text-slate-500">{stats.inventory.totalItems - stats.inventory.lowStockItems - stats.inventory.outOfStockItems} healthy • {stats.inventory.lowStockItems} low</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-600">Active Operations</p>
                <p className="text-xl font-bold text-slate-900">
                  {activeOperations}
                </p>
                <p className="text-xs text-slate-500">Transfers in-transit</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-600">Monthly Item Entries</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatCurrency(stats.itemEntries.thisMonthValue)}
                </p>
                <p className="text-xs text-slate-500">{stats.itemEntries.thisMonthEntries} entries this month</p>
              </div>
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Section */}
      {stats.inventory.lowStockItems > 0 && (
        <Card className="border-0 shadow-sm bg-white border-l-4 border-l-amber-400">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="font-semibold text-slate-900">Stock Level Alert</h3>
                <p className="text-sm text-slate-600">Items requiring immediate attention</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">{stats.inventory.lowStockItems}</p>
                  <p className="text-xs text-slate-600">Low Stock</p>
                </div>
                <Separator orientation="vertical" className="h-12" />
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{stats.inventory.outOfStockItems}</p>
                  <p className="text-xs text-slate-600">Out of Stock</p>
                </div>
              </div>
              <Link href="/dashboard/inventory/low-stock">
                <Button variant="outline" size="sm">
                  View Details
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operations Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item Entry Operations */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-slate-900">Item Entry Operations</h3>
              </div>
              <Link href="/dashboard/item-entries">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Entries</span>
                <span className="font-semibold text-slate-900">{formatNumber(stats.itemEntries.totalEntries)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">This Month</span>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {stats.itemEntries.thisMonthEntries}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Monthly Value</span>
                <span className="font-semibold text-slate-900">{formatCurrency(stats.itemEntries.thisMonthValue)}</span>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">Total Value</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(stats.itemEntries.totalValue)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Operations */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-900">Transfer Operations</h3>
              </div>
              <Link href="/dashboard/transfers">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Transfers</span>
                <span className="font-semibold text-slate-900">{formatNumber(stats.transfers.totalTransfers)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">In Transit</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  {stats.transfers.inTransitTransfers}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed</span>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {stats.transfers.completedTransfers}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">This Month</span>
              <span className="text-lg font-bold text-slate-900">{formatNumber(stats.transfers.thisMonthTransfers)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Operations */}
        <Card className="border-0 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-900">Withdrawal Operations</h3>
              </div>
              <Link href="/dashboard/withdrawals">
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Total Withdrawals</span>
                <span className="font-semibold text-slate-900">{formatNumber(stats.withdrawals.totalWithdrawals)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Completed</span>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  {stats.withdrawals.completedWithdrawals}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Cancelled</span>
                <Badge variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                  {stats.withdrawals.cancelledWithdrawals}
                </Badge>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-900">This Month</span>
              <span className="text-lg font-bold text-slate-900">{formatNumber(stats.withdrawals.thisMonthWithdrawals)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Quick Actions Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity Timeline - Takes 2 columns */}
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-sm bg-white h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <h3 className="font-semibold text-slate-900 text-sm">Recent Activity</h3>
                </div>
                <span className="text-xs text-slate-600">Last 24 hours</span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-slate-400" />
                  </div>
                  <h4 className="text-sm font-medium text-slate-900 mb-1">No Recent Activity</h4>
                  <p className="text-xs text-slate-600">System activities will appear here as they occur</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats.recentActivity.slice(0, 8).map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type)
                    const statusVariant = getStatusVariant(activity.status)
                    const StatusIcon = statusVariant.icon
                    
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-md border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="w-8 h-8 bg-slate-50 rounded-md flex items-center justify-center flex-shrink-0">
                          <ActivityIcon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-slate-900 truncate text-sm">
                              {activity.title}
                            </h4>
                            <Badge variant="outline" className={`${statusVariant.className} flex items-center space-x-1 text-xs px-2 py-0.5`}>
                              <StatusIcon className="w-2.5 h-2.5" />
                              <span className="capitalize">{activity.status.replace(/_/g, ' ').toLowerCase()}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600 mb-1 truncate">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-slate-500">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{formatDate(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Takes 1 column */}
        <div className="xl:col-span-1">
          <Card className="border-0 shadow-sm bg-white h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-sm">Quick Actions</h3>
                <p className="text-xs text-slate-600">Streamline</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 gap-2">
                <Link href="/dashboard/item-entries/create" className="group">
                  <div className="p-3 rounded-md border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-md flex items-center justify-center group-hover:bg-blue-100 transition-colors flex-shrink-0">
                        <Plus className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-900 group-hover:text-blue-700 transition-colors text-sm">
                          Add Item Entry
                        </h4>
                        <p className="text-xs text-slate-600">Record new inventory items</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/transfers/create" className="group">
                  <div className="p-3 rounded-md border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-50 rounded-md flex items-center justify-center group-hover:bg-purple-100 transition-colors flex-shrink-0">
                        <ArrowRightLeft className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-900 group-hover:text-purple-700 transition-colors text-sm">
                          Create Transfer
                        </h4>
                        <p className="text-xs text-slate-600">Move items between locations</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/withdrawals/create" className="group">
                  <div className="p-3 rounded-md border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-md flex items-center justify-center group-hover:bg-emerald-100 transition-colors flex-shrink-0">
                        <Truck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-900 group-hover:text-emerald-700 transition-colors text-sm">
                          Create Withdrawal
                        </h4>
                        <p className="text-xs text-slate-600">Request materials for production</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/dashboard/inventory/current" className="group">
                  <div className="p-3 rounded-md border border-slate-100 hover:border-orange-200 hover:shadow-sm transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-md flex items-center justify-center group-hover:bg-orange-100 transition-colors flex-shrink-0">
                        <Package className="w-4 h-4 text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium text-slate-900 group-hover:text-orange-700 transition-colors text-sm">
                          View Inventory
                        </h4>
                        <p className="text-xs text-slate-600">Check current stock levels</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}