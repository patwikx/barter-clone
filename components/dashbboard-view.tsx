"use client"

import React, { useState, useTransition } from "react"
import {
  Package,
  ShoppingCart,
  ArrowRightLeft,
  Truck,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  Calendar,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats, type DashboardStats } from "@/lib/actions/dashboard-actions"
import { toast } from "sonner"
import Link from "next/link"

interface DashboardViewProps {
  initialStats?: DashboardStats
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'PURCHASE':
      return ShoppingCart
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

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return "bg-yellow-100 text-yellow-800"
    case 'approved':
      return "bg-blue-100 text-blue-800"
    case 'completed':
    case 'received':
      return "bg-green-100 text-green-800"
    case 'cancelled':
    case 'rejected':
      return "bg-red-100 text-red-800"
    case 'in_transit':
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
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
      currency: 'PHP'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-PH').format(num)
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Please wait while we load your dashboard data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your warehouse management system</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Inventory Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.inventory.totalItems)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.inventory.totalValue)} total value
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Link href="/dashboard/inventory/current">
                <Button variant="outline" size="sm">View Details</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.inventory.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Link href="/dashboard/inventory/low-stock">
                <Button variant="outline" size="sm">View Items</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.purchases.pendingPurchases}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.purchases.thisMonthPurchases)} this month
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Link href="/dashboard/purchases">
                <Button variant="outline" size="sm">View Orders</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Transfers</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.transfers.pendingTransfers + stats.transfers.inTransitTransfers}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(stats.transfers.thisMonthTransfers)} this month
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Link href="/dashboard/transfers">
                <Button variant="outline" size="sm">View Transfers</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Purchase Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Orders</span>
              <span className="font-medium">{formatNumber(stats.purchases.totalPurchases)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Value</span>
              <span className="font-medium">{formatCurrency(stats.purchases.totalValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Approval</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {stats.purchases.pendingPurchases}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowRightLeft className="w-5 h-5 mr-2" />
              Transfer Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Transfers</span>
              <span className="font-medium">{formatNumber(stats.transfers.totalTransfers)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {stats.transfers.pendingTransfers}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">In Transit</span>
              <Badge className="bg-blue-100 text-blue-800">
                {stats.transfers.inTransitTransfers}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="w-5 h-5 mr-2" />
              Withdrawal Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Requests</span>
              <span className="font-medium">{formatNumber(stats.withdrawals.totalWithdrawals)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending</span>
              <Badge className="bg-yellow-100 text-yellow-800">
                {stats.withdrawals.pendingWithdrawals}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Approved</span>
              <Badge className="bg-blue-100 text-blue-800">
                {stats.withdrawals.approvedWithdrawals}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No recent activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => {
                const ActivityIcon = getActivityIcon(activity.type)
                return (
                  <div key={activity.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ActivityIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{activity.title}</span>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{activity.description}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{activity.timestamp.toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/purchases/create">
            <CardContent className="p-6 text-center">
              <ShoppingCart className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Create Purchase Order</h3>
              <p className="text-sm text-gray-500 mt-1">Order new inventory</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/transfers/create">
            <CardContent className="p-6 text-center">
              <ArrowRightLeft className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Create Transfer</h3>
              <p className="text-sm text-gray-500 mt-1">Move inventory between warehouses</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/withdrawals/create">
            <CardContent className="p-6 text-center">
              <Truck className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Request Withdrawal</h3>
              <p className="text-sm text-gray-500 mt-1">Request materials for production</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/inventory/current">
            <CardContent className="p-6 text-center">
              <Package className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">View Inventory</h3>
              <p className="text-sm text-gray-500 mt-1">Check current stock levels</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}