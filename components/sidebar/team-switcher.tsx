"use client"
import * as React from "react"
import { ChevronsUpDown, Plus, Building, MapPin } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Types based on your Prisma schema
interface Warehouse {
  id: string
  name: string
  location: string | null
  description: string | null
  isMainWarehouse: boolean
}

interface WarehouseSwitcherProps {
  warehouses: Warehouse[]
  currentWarehouseId?: string | null
  onWarehouseChange?: (warehouseId: string) => void
  canManageWarehouses?: boolean
}

export function WarehouseSwitcher({ 
  warehouses, 
  currentWarehouseId,
  onWarehouseChange,
  canManageWarehouses = false
}: WarehouseSwitcherProps) {
  const { isMobile } = useSidebar()
  
  // Find current warehouse or default to main warehouse or first warehouse
  const currentWarehouse = React.useMemo(() => {
    if (currentWarehouseId) {
      const found = warehouses.find(w => w.id === currentWarehouseId)
      if (found) return found
    }
    
    // Fallback to main warehouse
    const mainWarehouse = warehouses.find(w => w.isMainWarehouse)
    if (mainWarehouse) return mainWarehouse
    
    // Fallback to first warehouse
    return warehouses[0] || null
  }, [warehouses, currentWarehouseId])

  const handleWarehouseSelect = (warehouse: Warehouse) => {
    if (onWarehouseChange && warehouse.id !== currentWarehouse?.id) {
      onWarehouseChange(warehouse.id)
    }
  }

  if (!currentWarehouse) {
    return null
  }

  return (
    <SidebarMenu className="mt-4">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Building className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <div className="flex items-center gap-1">
                  <span className="truncate font-medium">{currentWarehouse.name}</span>
                  {currentWarehouse.isMainWarehouse && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                      Main
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {currentWarehouse.location && (
                    <>
                      <MapPin className="size-3" />
                      <span className="truncate">{currentWarehouse.location}</span>
                    </>
                  )}
                </div>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Switch Warehouse
            </DropdownMenuLabel>
            {warehouses.map((warehouse, index) => (
              <DropdownMenuItem
                key={warehouse.id}
                onClick={() => handleWarehouseSelect(warehouse)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <Building className="size-3.5 shrink-0" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{warehouse.name}</span>
                    {warehouse.isMainWarehouse && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                        Main
                      </span>
                    )}
                  </div>
                  {warehouse.location && (
                    <span className="text-xs text-muted-foreground truncate">
                      {warehouse.location}
                    </span>
                  )}
                </div>
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {canManageWarehouses && (
              <DropdownMenuItem className="gap-2 p-2">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="font-medium text-muted-foreground">Add warehouse</div>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}