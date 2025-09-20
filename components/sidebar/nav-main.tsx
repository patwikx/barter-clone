"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { IconPlus } from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

// Define types
interface Permission {
  permission: string
}

interface CustomUser {
  permissions?: Permission[]
}

interface CustomSession {
  user?: CustomUser
}

interface SubItem {
  title: string
  url: string
}

interface NavMainItem {
  title: string
  url: string
  icon?: Icon
  isActive?: boolean
  items?: SubItem[]
}

interface QuickCreateOption {
  title: string
  url: string
  description: string
}

interface NavMainProps {
  items: NavMainItem[]
}

// Permission constants
const PERMISSIONS = {
  CREATE_PURCHASES: "CREATE_PURCHASES",
  CREATE_TRANSFERS: "CREATE_TRANSFERS",
  REQUEST_WITHDRAWALS: "REQUEST_WITHDRAWALS",
  ADJUST_INVENTORY: "ADJUST_INVENTORY",
  CREATE_ITEMS: "CREATE_ITEMS",
} as const

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname()
  const { data: session } = useSession() as { data: CustomSession | null }

  // Check user permissions with proper typing
  const hasPermission = (permission: string): boolean => {
    return session?.user?.permissions?.some(p => p.permission === permission) ?? false
  }

  // Quick create options based on user permissions
  const quickCreateOptions: QuickCreateOption[] = [
    ...(hasPermission(PERMISSIONS.CREATE_PURCHASES) ? [{
      title: "Purchase Order",
      url: "/dashboard/purchases/create",
      description: "Create a new purchase order"
    }] : []),
    ...(hasPermission(PERMISSIONS.CREATE_TRANSFERS) ? [{
      title: "Stock Transfer",
      url: "/dashboard/transfers/create",
      description: "Transfer items between warehouses"
    }] : []),
    ...(hasPermission(PERMISSIONS.REQUEST_WITHDRAWALS) ? [{
      title: "Withdrawal Request",
      url: "/dashboard/withdrawals/create",
      description: "Request items for production"
    }] : []),
    ...(hasPermission(PERMISSIONS.ADJUST_INVENTORY) ? [{
      title: "Inventory Adjustment",
      url: "/dashboard/adjustments/create",
      description: "Adjust inventory quantities"
    }] : []),
    ...(hasPermission(PERMISSIONS.CREATE_ITEMS) ? [{
      title: "New Item",
      url: "/dashboard/items/create",
      description: "Add item to catalog"
    }] : []),
  ]

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Quick Actions Section */}
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  tooltip="Quick Create"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  disabled={quickCreateOptions.length === 0}
                >
                  <IconPlus />
                  <span className="group-data-[collapsible=icon]:hidden">Quick Create</span>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {quickCreateOptions.length > 0 && (
                <DropdownMenuContent align="start" className="w-64">
                  <DropdownMenuLabel>Create New</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {quickCreateOptions.map((option) => (
                    <DropdownMenuItem key={option.title} asChild>
                      <Link href={option.url} className="flex flex-col items-start">
                        <span className="font-medium">{option.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        
        {/* Navigation Menu */}
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
            
            // If item has subitems, render as collapsible
            if (item.items && item.items.length > 0) {
              return (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive ?? isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }
            
            // Regular menu item without subitems
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton tooltip={item.title} asChild isActive={isActive}>
                  <Link href={item.url}>
                    {item.icon && <item.icon className="size-4" />}
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