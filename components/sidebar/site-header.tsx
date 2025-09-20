"use client"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { IconBell, IconSearch, IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()

  // Get page title based on current path
  const getPageTitle = (path: string) => {
    const pathSegments = path.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1]
    
    const titleMap: Record<string, string> = {
      dashboard: "Dashboard",
      inventory: "Inventory Management",
      purchases: "Purchase Orders",
      transfers: "Stock Transfers",
      withdrawals: "Material Withdrawals",
      adjustments: "Inventory Adjustments",
      items: "Items & Catalog",
      warehouses: "Warehouses",
      suppliers: "Suppliers",
      reports: "Reports & Analytics",
      users: "User Management",
      settings: "System Settings",
      audit: "Audit Logs",
      notifications: "Notifications",
      profile: "User Profile",
    }

    // If it's a create/edit page
    if (pathSegments.includes('create')) {
      const parentSection = pathSegments[pathSegments.length - 2]
      return `Create New ${titleMap[parentSection]?.slice(0, -1) || 'Item'}`
    }
    if (pathSegments.includes('edit')) {
      const parentSection = pathSegments[pathSegments.length - 3]
      return `Edit ${titleMap[parentSection]?.slice(0, -1) || 'Item'}`
    }

    return titleMap[lastSegment] || "InventoryPro"
  }

  const pageTitle = getPageTitle(pathname)

  // Mock notification count - in real app, this would come from an API
  const notificationCount = 3

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4"
        />
        
        {/* Page Title */}
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>
        
        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Search items, orders, suppliers..."
              className="pl-10 h-9"
            />
          </div>
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Refresh button for data-heavy pages */}
          {(pathname.includes('/inventory') || pathname.includes('/dashboard')) && (
            <Button variant="ghost" size="sm">
              <IconRefresh className="size-4" />
              <span className="sr-only">Refresh data</span>
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <IconBell className="size-4" />
                {notificationCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground"
                  >
                    {notificationCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                Notifications
                <Badge variant="secondary" className="text-xs">
                  {notificationCount} new
                </Badge>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <div className="font-medium text-sm">Low Stock Alert</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Steel Bolts (ITEM-001) is below reorder level
                </div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <div className="font-medium text-sm">Purchase Order Approved</div>
                <div className="text-xs text-muted-foreground mt-1">
                  PO-2024-004 has been approved by manager
                </div>
                <div className="text-xs text-muted-foreground">4 hours ago</div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start p-3">
                <div className="font-medium text-sm">Transfer Completed</div>
                <div className="text-xs text-muted-foreground mt-1">
                  TRF-2024-002 from Main to Secondary warehouse
                </div>
                <div className="text-xs text-muted-foreground">1 day ago</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-center text-sm">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User info display */}
          {session?.user && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <div className="text-right">
                <div className="font-medium">{session.user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {session.user.role?.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}