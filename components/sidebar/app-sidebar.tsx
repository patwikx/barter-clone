"use client"
import * as React from "react"
import type { Icon } from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import {
  IconPackage,
  IconDashboard,
  IconShoppingCart,
  IconTruck,
  IconArrowsExchange,
  IconAdjustments,
  IconUsers,
  IconBuilding,
  IconChartBar,
  IconSettings,
  IconHelp,
  IconSearch,
  IconClipboardList,
  IconHistory,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import { WarehouseSwitcher } from "./team-switcher"
import { NavDocuments } from "./nav-docs"


// Types based on your Prisma schema
type Permission = "CREATE_ITEMS" | "UPDATE_ITEMS" | "DELETE_ITEMS" | "VIEW_ITEMS" |
  "CREATE_PURCHASES" | "APPROVE_PURCHASES" | "VIEW_PURCHASES" | "CANCEL_PURCHASES" |
  "CREATE_TRANSFERS" | "APPROVE_TRANSFERS" | "VIEW_TRANSFERS" | "CANCEL_TRANSFERS" |
  "REQUEST_WITHDRAWALS" | "APPROVE_WITHDRAWALS" | "VIEW_WITHDRAWALS" | "CANCEL_WITHDRAWALS" |
  "ADJUST_INVENTORY" | "VIEW_INVENTORY" | "RECOUNT_INVENTORY" |
  "VIEW_REPORTS" | "EXPORT_REPORTS" | "VIEW_COST_REPORTS" |
  "MANAGE_USERS" | "MANAGE_WAREHOUSES" | "MANAGE_SUPPLIERS" | "VIEW_AUDIT_LOGS" | "SYSTEM_SETTINGS"

type UserRole = "SUPER_ADMIN" | "ADMIN" | "WAREHOUSE_MANAGER" | "INVENTORY_CLERK" | "PURCHASER" | "APPROVER" | "USER" | "VIEWER"

interface UserPermission {
  id: string
  permission: Permission
  grantedAt: Date
  expiresAt?: Date | null
}

interface Warehouse {
  id: string
  name: string
  location: string | null
  description: string | null
  isMainWarehouse: boolean
}

interface CustomUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  role: UserRole
  department?: string | null
  position?: string | null
  employeeId?: string | null
  permissions: UserPermission[]
}

interface CustomSession {
  user: CustomUser
}

// Permission constants for type safety
const PERMISSIONS = {
  VIEW_INVENTORY: "VIEW_INVENTORY" as Permission,
  VIEW_PURCHASES: "VIEW_PURCHASES" as Permission,
  CREATE_PURCHASES: "CREATE_PURCHASES" as Permission,
  VIEW_TRANSFERS: "VIEW_TRANSFERS" as Permission,
  CREATE_TRANSFERS: "CREATE_TRANSFERS" as Permission,
  VIEW_WITHDRAWALS: "VIEW_WITHDRAWALS" as Permission,
  REQUEST_WITHDRAWALS: "REQUEST_WITHDRAWALS" as Permission,
  ADJUST_INVENTORY: "ADJUST_INVENTORY" as Permission,
  VIEW_ITEMS: "VIEW_ITEMS" as Permission,
  MANAGE_WAREHOUSES: "MANAGE_WAREHOUSES" as Permission,
  MANAGE_SUPPLIERS: "MANAGE_SUPPLIERS" as Permission,
  VIEW_REPORTS: "VIEW_REPORTS" as Permission,
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS" as Permission,
  MANAGE_USERS: "MANAGE_USERS" as Permission,
  SYSTEM_SETTINGS: "SYSTEM_SETTINGS" as Permission,
} as const

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  warehouses?: Warehouse[]
  currentWarehouseId?: string | null
  onWarehouseChange?: (warehouseId: string) => void
}

export function AppSidebar({ 
  warehouses = [], 
  currentWarehouseId,
  onWarehouseChange,
  ...props 
}: AppSidebarProps) {
  const { data: session } = useSession() as { data: CustomSession | null }
  
  // Check if user has specific permission with expiration check
  const hasPermission = React.useCallback((permission: Permission): boolean => {
    if (!session?.user?.permissions) return false
    
    const userPermission = session.user.permissions.find(p => p.permission === permission)
    if (!userPermission) return false
    
    // Check if permission has expired
    if (userPermission.expiresAt && new Date(userPermission.expiresAt) < new Date()) {
      return false
    }
    
    return true
  }, [session?.user?.permissions])

  // Memoized navigation items based on permissions
  const navMain = React.useMemo(() => {
    const items: Array<{
      title: string
      url: string
      icon: Icon
      items?: Array<{ title: string; url: string }>
    }> = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: IconDashboard,
      }
    ]

    if (hasPermission(PERMISSIONS.VIEW_INVENTORY)) {
      items.push({
        title: "Inventory",
        url: "/dashboard/inventory",
        icon: IconPackage,
        items: [
          { title: "Current Stock", url: "/dashboard/inventory/current" },
          { title: "Low Stock Items", url: "/dashboard/inventory/low-stock" },
          { title: "Stock Movements", url: "/dashboard/inventory/movements" }
        ]
      })
    }

    if (hasPermission(PERMISSIONS.VIEW_PURCHASES) || hasPermission(PERMISSIONS.CREATE_PURCHASES)) {
      items.push({
        title: "Purchases",
        url: "/dashboard/purchases",
        icon: IconShoppingCart,
        items: [
          { title: "Purchase Orders", url: "/dashboard/purchases/orders" },
          { title: "Receipts", url: "/dashboard/purchases/receipts" },
          { title: "Pending Approvals", url: "/dashboard/purchases/approvals" }
        ]
      })
    }

    if (hasPermission(PERMISSIONS.VIEW_TRANSFERS) || hasPermission(PERMISSIONS.CREATE_TRANSFERS)) {
      items.push({
        title: "Transfers",
        url: "/dashboard/transfers",
        icon: IconArrowsExchange,
        items: [
          { title: "Active Transfers", url: "/dashboard/transfers/active" },
          { title: "Transfer History", url: "/dashboard/transfers/history" }
        ]
      })
    }

    if (hasPermission(PERMISSIONS.VIEW_WITHDRAWALS) || hasPermission(PERMISSIONS.REQUEST_WITHDRAWALS)) {
      items.push({
        title: "Withdrawals",
        url: "/dashboard/withdrawals",
        icon: IconTruck,
        items: [
          { title: "Pending Requests", url: "/dashboard/withdrawals/pending" },
          { title: "Withdrawal History", url: "/dashboard/withdrawals/history" }
        ]
      })
    }

    if (hasPermission(PERMISSIONS.ADJUST_INVENTORY)) {
      items.push({
        title: "Adjustments",
        url: "/dashboard/adjustments",
        icon: IconAdjustments,
      })
    }

    return items
  }, [hasPermission])

  // Management items based on permissions
  const managementItems = React.useMemo(() => {
    const items: Array<{
      name: string
      url: string
      icon: Icon
    }> = []

    if (hasPermission(PERMISSIONS.VIEW_ITEMS)) {
      items.push({
        name: "Items & Catalog",
        url: "/dashboard/items",
        icon: IconClipboardList,
      })
    }

    if (hasPermission(PERMISSIONS.MANAGE_WAREHOUSES)) {
      items.push({
        name: "Warehouses",
        url: "/dashboard/warehouses",
        icon: IconBuilding,
      })
    }

    if (hasPermission(PERMISSIONS.MANAGE_SUPPLIERS)) {
      items.push({
        name: "Suppliers",
        url: "/dashboard/suppliers",
        icon: IconTruck,
      })
    }

    if (hasPermission(PERMISSIONS.VIEW_REPORTS)) {
      items.push({
        name: "Reports",
        url: "/dashboard/reports",
        icon: IconChartBar,
      })
    }

    if (hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS)) {
      items.push({
        name: "Audit Logs",
        url: "/dashboard/audit",
        icon: IconHistory,
      })
    }

    if (hasPermission(PERMISSIONS.MANAGE_USERS)) {
      items.push({
        name: "User Management",
        url: "/dashboard/users",
        icon: IconUsers,
      })
    }

    return items
  }, [hasPermission])

  const navSecondary = React.useMemo(() => {
    const items: Array<{
      title: string
      url: string
      icon: Icon
    }> = [
      {
        title: "Help & Support",
        url: "/dashboard/help",
        icon: IconHelp,
      },
      {
        title: "Search",
        url: "/dashboard/search",
        icon: IconSearch,
      }
    ]

    if (hasPermission(PERMISSIONS.SYSTEM_SETTINGS)) {
      items.unshift({
        title: "Settings",
        url: "/dashboard/settings",
        icon: IconSettings,
      })
    }

    return items
  }, [hasPermission])

  // User data for navigation
  const userData = React.useMemo(() => {
    if (!session?.user) {
      return {
        name: "Unknown User",
        email: "",
        avatar: "",
        role: "USER" as UserRole,
        department: "",
        position: "",
      }
    }

    return {
      name: session.user.name ?? "Unknown User",
      email: session.user.email ?? "",
      avatar: session.user.image ?? "",
      role: session.user.role,
      department: session.user.department ?? "",
      position: session.user.position ?? "",
      employeeId: session.user.employeeId ?? undefined,
    }
  }, [session?.user])

  const canManageWarehouses = hasPermission(PERMISSIONS.MANAGE_WAREHOUSES)

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>

          <WarehouseSwitcher
            warehouses={warehouses}
            currentWarehouseId={currentWarehouseId}
            onWarehouseChange={onWarehouseChange}
            canManageWarehouses={canManageWarehouses}
          />
   
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={navMain} />
        {managementItems.length > 0 && (
          <NavDocuments items={managementItems} title="Management" />
        )}
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}