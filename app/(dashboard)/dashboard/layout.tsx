import type { Metadata } from "next"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/auth"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { SidebarWrapper } from "@/components/sidebar/sidebar-wrapper"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Toaster } from "@/components/ui/sonner"
import { getUserNotifications } from "@/lib/actions/notifs"
import { prisma } from "@/lib/prisma"
import type { Notification } from "@/types/notifications"

export const metadata: Metadata = {
  title: "InventoryPro - Warehouse Management System",
  description: "Complete inventory and warehouse management solution",
}

interface Warehouse {
  id: string
  name: string
  location: string | null
  description: string | null
  isMainWarehouse: boolean
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  
  // Fetch warehouses and notifications in parallel
  const [warehousesResult, notificationsResult] = await Promise.allSettled([
    // Fetch warehouses
    prisma.warehouse.findMany({
      select: {
        id: true,
        name: true,
        location: true,
        description: true,
        isMainWarehouse: true,
      },
      orderBy: [
        { isMainWarehouse: 'desc' }, // Main warehouse first
        { name: 'asc' }
      ]
    }),
    // Fetch notifications if user is logged in
    session?.user?.id ? getUserNotifications(20) : Promise.resolve({ success: false, notifications: [] })
  ])

  // Handle warehouses
  const warehouses: Warehouse[] = warehousesResult.status === 'fulfilled' 
    ? warehousesResult.value 
    : []

  // Handle notifications
  let initialNotifications: Notification[] = []
  if (notificationsResult.status === 'fulfilled' && notificationsResult.value.success && notificationsResult.value.notifications) {
    initialNotifications = notificationsResult.value.notifications
  }

  // Get current warehouse ID from user preferences or default to main warehouse
  const currentWarehouseId = warehouses.find(w => w.isMainWarehouse)?.id || warehouses[0]?.id || null

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <SidebarWrapper 
          warehouses={warehouses}
          currentWarehouseId={currentWarehouseId}
        />
        <SidebarInset>
          <SiteHeader initialNotifications={initialNotifications} />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </SessionProvider>
  )
}