"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Icon } from "@tabler/icons-react"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Types based on your Prisma schema
interface SecondaryNavItem {
  title: string
  url: string
  icon: Icon
}

interface NavSecondaryProps {
  items: SecondaryNavItem[]
  className?: string
}

export function NavSecondary({ items, className }: NavSecondaryProps) {
  const pathname = usePathname()
 
  return (
    <SidebarGroup className={className}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
           
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  size="sm"
                  asChild
                  isActive={isActive}
                >
                  <Link href={item.url}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}