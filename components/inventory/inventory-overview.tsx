"use client"

import React from "react"
import {
  Package,
  BarChart3,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const inventoryModules = [
  {
    title: "Current Stock",
    description: "View real-time inventory levels across all warehouses",
    icon: Package,
    href: "/dashboard/inventory/current",
    color: "bg-blue-100 text-blue-600",
    stats: "Track quantities and values"
  },
  {
    title: "Low Stock Items",
    description: "Items that are below their reorder levels",
    icon: TrendingDown,
    href: "/dashboard/inventory/low-stock",
    color: "bg-orange-100 text-orange-600",
    stats: "Prevent stockouts"
  },
  {
    title: "Stock Movements",
    description: "Complete history of all inventory transactions",
    icon: BarChart3,
    href: "/dashboard/inventory/movements",
    color: "bg-green-100 text-green-600",
    stats: "Audit trail"
  }
]

export function InventoryOverview() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Comprehensive inventory control and monitoring</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              Across all warehouses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">23</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱2,456,789</div>
            <p className="text-xs text-muted-foreground">
              Current inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Modules */}
      <div className="grid grid-cols-1 m d:grid-cols-2 lg:grid-cols-3 gap-6">
        {inventoryModules.map((module) => {
          const IconComponent = module.icon
          
          return (
            <Card key={module.title} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <Link href={module.href}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {module.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3">
                    {module.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{module.stats}</span>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Recent Inventory Activity
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/inventory/movements">
                View All Movements
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Purchase Receipt - PO-2024-001</div>
                <div className="text-sm text-gray-500">500 units of Steel Bolts received</div>
              </div>
              <div className="text-sm text-gray-500">2 hours ago</div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Transfer - TRF-2024-001</div>
                <div className="text-sm text-gray-500">100 units transferred to Secondary Warehouse</div>
              </div>
              <div className="text-sm text-gray-500">4 hours ago</div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Withdrawal - WTH-2024-001</div>
                <div className="text-sm text-gray-500">50 units withdrawn for production</div>
              </div>
              <div className="text-sm text-gray-500">6 hours ago</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}