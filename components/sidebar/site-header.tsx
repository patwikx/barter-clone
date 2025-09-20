"use client"
import { usePathname } from "next/navigation"
import { useState, useTransition, useEffect } from "react"
import { IconBell, IconSearch, IconRefresh, IconClock } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { markNotificationAsRead, markAllNotificationsAsRead } from "@/lib/actions/notifs"
import type { Notification } from "@/types/notifications"
import { cn } from "@/lib/utils"

interface SiteHeaderProps {
  initialNotifications?: Notification[]
}

export function SiteHeader({ initialNotifications = [] }: SiteHeaderProps) {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [currentTime, setCurrentTime] = useState(new Date())

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleMarkAsRead = (notificationId: string) => {
    startTransition(async () => {
      try {
        await markNotificationAsRead(notificationId)
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      try {
        await markAllNotificationsAsRead()
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    })
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'now'
    if (diffMinutes < 60) return `${diffMinutes}m`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`
    return `${Math.floor(diffMinutes / 1440)}d`
  }

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
          {/* System Time & Date */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-muted-foreground">
            <IconClock className="size-4" />
            <div className="text-right">
              <span className="font-medium text-foreground">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="font-medium ml-2">
                {currentTime.toLocaleDateString([], { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>

          <Separator orientation="vertical" className="hidden lg:block h-6" />

          {/* Refresh button for data-heavy pages */}
          {(pathname.includes('/inventory') || pathname.includes('/dashboard')) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <IconRefresh className={cn("size-4", isRefreshing && "animate-spin")} />
              <span className="sr-only">Refresh data</span>
            </Button>
          )}

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="relative">
                <IconBell className="size-4" />
                {unreadCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMarkAllAsRead}
                    disabled={isPending}
                    className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              
              {/* Content */}
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <IconBell className="mx-auto h-8 w-8 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {notifications.slice(0, 10).map((notification) => (
                      <div 
                        key={notification.id}
                        className={cn(
                          "group cursor-pointer p-4 hover:bg-muted/50",
                          !notification.isRead && "bg-muted/30"
                        )}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "mt-1.5 h-2 w-2 rounded-full",
                            !notification.isRead ? "bg-primary" : "bg-muted-foreground/30"
                          )} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {notifications.length > 10 && (
                <div className="border-t p-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    View all notifications
                  </Button>
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  )
}