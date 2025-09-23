"use client"
import * as React from "react"
import type { Icon } from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import {
  IconPackage,
  IconDashboard,
  IconTruck,
  IconArrowsExchange,
  IconUsers,
  IconBuilding,
  IconChartBar,
  IconSettings,
  IconHelp,
  IconSearch,
  IconClipboardList,
  IconHistory,
  IconMinus,
  IconPlus,
  IconShoppingCart,
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

// Types based on your updated Prisma schema
type Permission = 
  // Item Management
  | "CREATE_ITEMS" 
  | "UPDATE_ITEMS" 
  | "DELETE_ITEMS" 
  | "VIEW_ITEMS"
  // Item Entry (Direct Purchase)
  | "CREATE_ITEM_ENTRIES"
  | "VIEW_ITEM_ENTRIES"
  // Transfer Management
  | "CREATE_TRANSFERS"
  | "VIEW_TRANSFERS"
  | "CANCEL_TRANSFERS"
  // Withdrawal Management
  | "CREATE_WITHDRAWALS"
  | "VIEW_WITHDRAWALS"
  | "CANCEL_WITHDRAWALS"
  // Inventory Management
  | "ADJUST_INVENTORY"
  | "VIEW_INVENTORY"
  | "RECOUNT_INVENTORY"
  // Reporting
  | "VIEW_REPORTS"
  | "EXPORT_REPORTS"
  | "VIEW_COST_REPORTS"
  // Administration
  | "MANAGE_USERS"
  | "MANAGE_WAREHOUSES"
  | "MANAGE_SUPPLIERS"
  | "VIEW_AUDIT_LOGS"
  | "SYSTEM_SETTINGS"

type UserRole = 
  | "SUPER_ADMIN" 
  | "ADMIN" 
  | "WAREHOUSE_MANAGER" 
  | "INVENTORY_CLERK" 
  | "PURCHASER" 
  | "USER" 
  | "VIEWER"

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

// Permission constants for type safety - updated to match schema
const PERMISSIONS = {
  // Inventory
  VIEW_INVENTORY: "VIEW_INVENTORY" as Permission,
  ADJUST_INVENTORY: "ADJUST_INVENTORY" as Permission,
  RECOUNT_INVENTORY: "RECOUNT_INVENTORY" as Permission,
  
  // Item Entries (replacing purchases)
  VIEW_ITEM_ENTRIES: "VIEW_ITEM_ENTRIES" as Permission,
  CREATE_ITEM_ENTRIES: "CREATE_ITEM_ENTRIES" as Permission,
  
  // Transfers
  VIEW_TRANSFERS: "VIEW_TRANSFERS" as Permission,
  CREATE_TRANSFERS: "CREATE_TRANSFERS" as Permission,
  CANCEL_TRANSFERS: "CANCEL_TRANSFERS" as Permission,
  
  // Withdrawals
  VIEW_WITHDRAWALS: "VIEW_WITHDRAWALS" as Permission,
  CREATE_WITHDRAWALS: "CREATE_WITHDRAWALS" as Permission,
  CANCEL_WITHDRAWALS: "CANCEL_WITHDRAWALS" as Permission,
  
  // Items
  VIEW_ITEMS: "VIEW_ITEMS" as Permission,
  CREATE_ITEMS: "CREATE_ITEMS" as Permission,
  UPDATE_ITEMS: "UPDATE_ITEMS" as Permission,
  DELETE_ITEMS: "DELETE_ITEMS" as Permission,
  
  // Management
  MANAGE_WAREHOUSES: "MANAGE_WAREHOUSES" as Permission,
  MANAGE_SUPPLIERS: "MANAGE_SUPPLIERS" as Permission,
  MANAGE_USERS: "MANAGE_USERS" as Permission,
  
  // Reports & Audit
  VIEW_REPORTS: "VIEW_REPORTS" as Permission,
  EXPORT_REPORTS: "EXPORT_REPORTS" as Permission,
  VIEW_COST_REPORTS: "VIEW_COST_REPORTS" as Permission,
  VIEW_AUDIT_LOGS: "VIEW_AUDIT_LOGS" as Permission,
  
  // System
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

  // Memoized navigation items based on permissions - updated routes
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
          { title: "Stock Movements", url: "/dashboard/inventory/movements" },
          ...(hasPermission(PERMISSIONS.ADJUST_INVENTORY) ? [
            { title: "Stock Adjustments", url: "/dashboard/inventory/adjustments" }
          ] : [])
        ]
      })
    }

    // Item Entries (replacing Purchases)
    if (hasPermission(PERMISSIONS.VIEW_ITEM_ENTRIES) || hasPermission(PERMISSIONS.CREATE_ITEM_ENTRIES)) {
      const subItems: Array<{ title: string; url: string }> = [
        { title: "All Entries", url: "/dashboard/item-entries" }
      ]
      
      if (hasPermission(PERMISSIONS.CREATE_ITEM_ENTRIES)) {
        subItems.push({ title: "Add Item Entry", url: "/dashboard/item-entries/create" })
      }

      items.push({
        title: "Item Entries",
        url: "/dashboard/item-entries",
        icon: IconPlus,
        items: subItems
      })
    }

    // Traditional Purchase Orders (if you want to keep both systems)
    if (hasPermission(PERMISSIONS.CREATE_PURCHASES) || hasPermission(PERMISSIONS.VIEW_PURCHASES)) {
      const subItems: Array<{ title: string; url: string }> = [
        { title: "All Purchase Orders", url: "/dashboard/purchases" }
      ]
      
      if (hasPermission(PERMISSIONS.CREATE_PURCHASES)) {
        subItems.push({ title: "Create Purchase Order", url: "/dashboard/purchases/create" })
      }

      items.push({
        title: "Purchase Orders",
        url: "/dashboard/purchases",
        icon: IconShoppingCart,
        items: subItems
      })
    }
    if (hasPermission(PERMISSIONS.VIEW_TRANSFERS) || hasPermission(PERMISSIONS.CREATE_TRANSFERS)) {
      const subItems: Array<{ title: string; url: string }> = [
        { title: "All Transfers", url: "/dashboard/transfers" }
      ]
      
      if (hasPermission(PERMISSIONS.CREATE_TRANSFERS)) {
        subItems.push({ title: "Create Transfer", url: "/dashboard/transfers/create" })
      }

      items.push({
        title: "Transfers",
        url: "/dashboard/transfers",
        icon: IconArrowsExchange,
        items: subItems
      })
    }

    if (hasPermission(PERMISSIONS.VIEW_WITHDRAWALS) || hasPermission(PERMISSIONS.CREATE_WITHDRAWALS)) {
      const subItems: Array<{ title: string; url: string }> = [
        { title: "All Withdrawals", url: "/dashboard/withdrawals" }
      ]
      
      if (hasPermission(PERMISSIONS.CREATE_WITHDRAWALS)) {
        subItems.push({ title: "Create Withdrawal", url: "/dashboard/withdrawals/create" })
      }

      items.push({
        title: "Withdrawals",
        url: "/dashboard/withdrawals",
        icon: IconMinus,
        items: subItems
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
      
      items.push({
        name: "Item Categories",
        url: "/dashboard/categories",
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

    if (hasPermission(PERMISSIONS.VIEW_REPORTS) || hasPermission(PERMISSIONS.VIEW_COST_REPORTS)) {
      items.push({
        name: "Reports",
        url: "/dashboard/reports",
        icon: IconChartBar,
      })
    }

    // Cost Accounting - always show as it's a core feature
    items.push({
      name: "Cost Accounting",
      url: "/dashboard/cost-accounting",
      icon: IconChartBar,
    })

    if (hasPermission(PERMISSIONS.VIEW_AUDIT_LOGS)) {
      items.push({
        name: "Audit Logs",
        url: "/dashboard/audit-logs",
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
      },
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