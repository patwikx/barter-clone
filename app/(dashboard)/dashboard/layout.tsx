import type { Metadata } from "next"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/auth"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import { SiteHeader } from "@/components/sidebar/site-header"
import { Toaster } from "@/components/ui/sonner"


export const metadata: Metadata = {
  title: "InventoryPro - Warehouse Management System",
  description: "Complete inventory and warehouse management solution",
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </SessionProvider>
  )
}