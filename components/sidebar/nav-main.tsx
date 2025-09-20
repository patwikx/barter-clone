"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { IconPlus, IconBell } from "@tabler/icons-react"
import type { Icon } from "@tabler/icons-react"
import { useSession } from "next-auth/react"
import { motion, type Variants } from "framer-motion"
import { Button } from "@/components/ui/button"
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

// Animation variants
const itemVariants: Variants = {
  hover: {
    x: 4,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  tap: {
    scale: 0.98,
    transition: { 
      duration: 0.1,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

const subMenuVariants: Variants = {
  closed: { 
    opacity: 0, 
    height: 0,
    transition: { 
      duration: 0.25,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  open: { 
    opacity: 1, 
    height: "auto",
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
      staggerChildren: 0.05
    }
  }
}

const subItemVariants: Variants = {
  closed: { 
    opacity: 0, 
    y: -5,
    transition: { duration: 0.15 }
  },
  open: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

const chevronVariants: Variants = {
  closed: { 
    rotate: 0,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  },
  open: { 
    rotate: 90,
    transition: { 
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1]
    }
  }
}

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
          <SidebarMenuItem className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={itemVariants}
                >
                  <SidebarMenuButton
                    tooltip="Quick Create"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                    disabled={quickCreateOptions.length === 0}
                  >
                    <IconPlus />
                    <span>Quick Create</span>
                  </SidebarMenuButton>
                </motion.div>
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
            
            <motion.div
              whileHover="hover"
              whileTap="tap"
              variants={itemVariants}
            >
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                asChild
              >
                <Link href="/dashboard/notifications">
                  <IconBell />
                  <span className="sr-only">Notifications</span>
                </Link>
              </Button>
            </motion.div>
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
                      <motion.div
                        whileHover="hover"
                        whileTap="tap"
                        variants={itemVariants}
                      >
                        <SidebarMenuButton tooltip={item.title} isActive={isActive}>
                          {item.icon && <item.icon className="size-4" />}
                          <span>{item.title}</span>
                          <motion.div
                            variants={chevronVariants}
                            animate={isActive ? "open" : "closed"}
                            className="ml-auto"
                          >
                            <ChevronRight className="size-4" />
                          </motion.div>
                        </SidebarMenuButton>
                      </motion.div>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                      <motion.div
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={subMenuVariants}
                      >
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <motion.div
                              key={subItem.title}
                              variants={subItemVariants}
                            >
                              <SidebarMenuSubItem>
                                <motion.div
                                  whileHover="hover"
                                  whileTap="tap"
                                  variants={itemVariants}
                                >
                                  <SidebarMenuSubButton asChild>
                                    <Link href={subItem.url}>
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </motion.div>
                              </SidebarMenuSubItem>
                            </motion.div>
                          ))}
                        </SidebarMenuSub>
                      </motion.div>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            }
            
            // Regular menu item without subitems
            return (
              <SidebarMenuItem key={item.title}>
                <motion.div
                  whileHover="hover"
                  whileTap="tap"
                  variants={itemVariants}
                >
                  <SidebarMenuButton 
                    tooltip={item.title}
                    asChild
                    isActive={isActive}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon className="size-4" />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </motion.div>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}