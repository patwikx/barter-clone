"use client"

import React, { useState, useTransition } from "react"
import {
  Bell,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Calendar,
  User,
  Trash2,
  Eye,
  MoreHorizontal,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  type NotificationData 
} from "@/lib/actions/notifs"
import { toast } from "sonner"

interface NotificationsViewProps {
  initialNotifications: NotificationData[]
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS':
      return CheckCircle
    case 'WARNING':
      return AlertTriangle
    case 'ERROR':
      return XCircle
    case 'INFO':
    default:
      return Info
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'SUCCESS':
      return "bg-green-100 text-green-800"
    case 'WARNING':
      return "bg-orange-100 text-orange-800"
    case 'ERROR':
      return "bg-red-100 text-red-800"
    case 'INFO':
    default:
      return "bg-blue-100 text-blue-800"
  }
}

export function NotificationsView({ initialNotifications }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>(initialNotifications)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getUserNotifications(100, showUnreadOnly)
      
      if (result.success) {
        setNotifications(result.notifications || [])
        toast.success("Notifications refreshed")
      } else {
        toast.error(result.error || "Failed to refresh notifications")
      }
    })
  }

  const handleMarkAsRead = (notificationId: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(notificationId)
      
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        )
      } else {
        toast.error("Failed to mark notification as read")
      }
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead()
      
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        toast.success("All notifications marked as read")
      } else {
        toast.error("Failed to mark all notifications as read")
      }
    })
  }

  const handleDeleteNotification = (notificationId: string) => {
    startTransition(async () => {
      const result = await deleteNotification(notificationId)
      
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        toast.success("Notification deleted")
      } else {
        toast.error("Failed to delete notification")
      }
    })
  }

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === "all" || notification.type === selectedType
    
    return matchesSearch && matchesType
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffMinutes < 1) return 'now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600 mt-1">
            Manage your system notifications and alerts
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-100 text-red-800">
                {unreadCount} unread
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isPending}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh} disabled={isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="INFO">
                    <div className="flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Info
                    </div>
                  </SelectItem>
                  <SelectItem value="SUCCESS">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Success
                    </div>
                  </SelectItem>
                  <SelectItem value="WARNING">
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="ERROR">
                    <div className="flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Error
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Switch 
                  id="unread-only" 
                  checked={showUnreadOnly} 
                  onCheckedChange={setShowUnreadOnly}
                />
                <Label htmlFor="unread-only" className="text-sm">
                  Unread only
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications ({filteredNotifications.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
              <p className="text-gray-500 text-center">
                {searchQuery || selectedType !== "all" || showUnreadOnly
                  ? "No notifications match your current filters."
                  : "You're all caught up! No notifications to display."}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredNotifications.map((notification) => {
                const TypeIcon = getTypeIcon(notification.type)
                
                return (
                  <div 
                    key={notification.id} 
                    className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                  >
                    <div className="flex items-start justify-between space-x-4">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 mt-1">
                          <TypeIcon className={`w-5 h-5 ${
                            notification.type === 'SUCCESS' ? 'text-green-500' :
                            notification.type === 'WARNING' ? 'text-orange-500' :
                            notification.type === 'ERROR' ? 'text-red-500' :
                            'text-blue-500'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </h4>
                            <Badge className={getTypeColor(notification.type)}>
                              {notification.type}
                            </Badge>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                            </div>
                            {notification.referenceType && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{notification.referenceType}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={isPending}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {!notification.isRead && (
                              <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Mark as Read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleDeleteNotification(notification.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}