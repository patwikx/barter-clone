"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// Define notification types
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'

export interface NotificationData {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  referenceId?: string
  referenceType?: string
  userId: string
}

// Create a new notification
export async function createNotification(data: {
  title: string
  message: string
  type: NotificationType
  userId: string
  referenceId?: string
  referenceType?: string
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const notification = await prisma.notification.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type,
        userId: data.userId,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        isRead: false,
      },
    })

    revalidatePath("/")
    return { success: true, notification }
  } catch (error) {
    console.error("Failed to create notification:", error)
    return { success: false, error: "Failed to create notification" }
  }
}

// Get notifications for current user
export async function getUserNotifications(
  limit: number = 50,
  onlyUnread: boolean = false
): Promise<{ success: boolean; notifications?: NotificationData[]; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(onlyUnread && { isRead: false }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })

    const formattedNotifications: NotificationData[] = notifications.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type as NotificationType,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      referenceId: notification.referenceId || undefined,
      referenceType: notification.referenceType || undefined,
      userId: notification.userId,
    }))

    return { success: true, notifications: formattedNotifications }
  } catch (error) {
    console.error("Failed to get notifications:", error)
    return { success: false, error: "Failed to get notifications" }
  }
}

// Mark a notification as read
export async function markNotificationAsRead(notificationId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    await prisma.notification.update({
      where: {
        id: notificationId,
        userId: session.user.id, // Ensure user can only update their own notifications
      },
      data: {
        isRead: true,
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to mark notification as read:", error)
    return { success: false, error: "Failed to mark notification as read" }
  }
}

// Mark all notifications as read for current user
export async function markAllNotificationsAsRead() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error)
    return { success: false, error: "Failed to mark all notifications as read" }
  }
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
        userId: session.user.id, // Ensure user can only delete their own notifications
      },
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete notification:", error)
    return { success: false, error: "Failed to delete notification" }
  }
}

// Get unread notification count
export async function getUnreadNotificationCount(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    })

    return { success: true, count }
  } catch (error) {
    console.error("Failed to get unread notification count:", error)
    return { success: false, error: "Failed to get unread notification count" }
  }
}

// Create inventory-specific notifications
export async function createLowStockNotification(itemId: string, currentQuantity: number, reorderLevel: number) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error("Unauthorized")
    }

    const item = await prisma.item.findUnique({
      where: { id: itemId },
      select: { itemCode: true, description: true }
    })

    if (!item) {
      throw new Error("Item not found")
    }

    // Get users who should receive low stock notifications (managers, admins, etc.)
    const usersToNotify = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_CLERK']
        },
        isActive: true,
      },
      select: { id: true }
    })

    const notifications = usersToNotify.map(user => ({
      title: 'Low Stock Alert',
      message: `${item.description} (${item.itemCode}) is below reorder level. Current: ${currentQuantity}, Reorder Level: ${reorderLevel}`,
      type: 'WARNING' as NotificationType,
      userId: user.id,
      referenceId: itemId,
      referenceType: 'ITEM',
      isRead: false,
    }))

    await prisma.notification.createMany({
      data: notifications,
    })

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to create low stock notification:", error)
    return { success: false, error: "Failed to create low stock notification" }
  }
}

// Create purchase order notifications
export async function createPurchaseOrderNotification(
  purchaseOrderId: string, 
  action: 'CREATED' | 'APPROVED' | 'RECEIVED',
  createdById?: string
) {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        createdBy: true,
      }
    })

    if (!purchase) {
      throw new Error("Purchase order not found")
    }

    let title: string
    let message: string
    let type: NotificationType = 'INFO'
    let usersToNotify: string[] = []

    switch (action) {
      case 'CREATED':
        title = 'Purchase Order Created'
        message = `Purchase Order ${purchase.purchaseOrder} has been created for ${purchase.supplier.name}`
        // Notify approvers
        const approvers = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'] },
            isActive: true,
          },
          select: { id: true }
        })
        usersToNotify = approvers.map(u => u.id)
        break

      case 'APPROVED':
        title = 'Purchase Order Approved'
        message = `Purchase Order ${purchase.purchaseOrder} has been approved`
        type = 'SUCCESS'
        // Notify creator and purchasing team
        const purchasingTeam = await prisma.user.findMany({
          where: {
            role: { in: ['PURCHASER', 'INVENTORY_CLERK'] },
            isActive: true,
          },
          select: { id: true }
        })
        usersToNotify = [purchase.createdById, ...purchasingTeam.map(u => u.id)]
        break

      case 'RECEIVED':
        title = 'Purchase Order Received'
        message = `Purchase Order ${purchase.purchaseOrder} has been received and processed`
        type = 'SUCCESS'
        // Notify creator and warehouse team
        const warehouseTeam = await prisma.user.findMany({
          where: {
            role: { in: ['WAREHOUSE_MANAGER', 'INVENTORY_CLERK'] },
            isActive: true,
          },
          select: { id: true }
        })
        usersToNotify = [purchase.createdById, ...warehouseTeam.map(u => u.id)]
        break
    }

    // Remove duplicates and exclude the person who triggered the action
    const uniqueUsers = [...new Set(usersToNotify)].filter(userId => userId !== createdById)

    if (uniqueUsers.length > 0) {
      const notifications = uniqueUsers.map(userId => ({
        title,
        message,
        type,
        userId,
        referenceId: purchaseOrderId,
        referenceType: 'PURCHASE',
        isRead: false,
      }))

      await prisma.notification.createMany({
        data: notifications,
      })
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to create purchase order notification:", error)
    return { success: false, error: "Failed to create purchase order notification" }
  }
}