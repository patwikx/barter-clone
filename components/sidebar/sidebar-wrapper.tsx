"use client"

import { AppSidebar } from "@/components/sidebar/app-sidebar"

interface Warehouse {
  id: string
  name: string
  location: string | null
  description: string | null
  isMainWarehouse: boolean
}

interface SidebarWrapperProps {
  warehouses: Warehouse[]
  currentWarehouseId: string | null
}

export function SidebarWrapper({ warehouses, currentWarehouseId }: SidebarWrapperProps) {
  const handleWarehouseChange = (warehouseId: string) => {
    // Store in localStorage for now
    localStorage.setItem('selectedWarehouseId', warehouseId)
    
    // You can also trigger a page refresh to update the context
    // window.location.reload()
    
    console.log('Switching to warehouse:', warehouseId)
  }

  return (
    <AppSidebar 
      warehouses={warehouses}
      currentWarehouseId={currentWarehouseId}
      onWarehouseChange={handleWarehouseChange}
    />
  )
}