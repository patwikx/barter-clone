"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { NotificationType } from "@prisma/client"

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
      type: notification.type,
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
      type: NotificationType.WARNING,
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

// Create item entry notifications (replaces purchase order notifications)
export async function createItemEntryNotification(
  itemEntryId: string, 
  action: 'CREATED' | 'RECEIVED',
  createdById?: string
) {
  try {
    const itemEntry = await prisma.itemEntry.findUnique({
      where: { id: itemEntryId },
      include: {
        supplier: true,
        item: true,
        createdBy: true,
        warehouse: true,
      }
    })

    if (!itemEntry) {
      throw new Error("Item entry not found")
    }

    let title: string
    let message: string
    let type: NotificationType = NotificationType.INFO
    let usersToNotify: string[] = []

    switch (action) {
      case 'CREATED':
        title = 'New Item Entry Created'
        message = `New stock received: ${itemEntry.item.description} (${itemEntry.quantity} ${itemEntry.item.unitOfMeasure}) from ${itemEntry.supplier.name} at ${itemEntry.warehouse.name}`
        type = NotificationType.SUCCESS
        // Notify warehouse managers and inventory clerks
        const warehouseTeam = await prisma.user.findMany({
          where: {
            role: { in: ['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_CLERK'] },
            isActive: true,
          },
          select: { id: true }
        })
        usersToNotify = warehouseTeam.map(u => u.id)
        break

      case 'RECEIVED':
        title = 'Item Entry Processed'
        message = `Item entry for ${itemEntry.item.description} has been processed and added to inventory`
        type = NotificationType.SUCCESS
        // Notify relevant warehouse staff
        const relevantUsers = await prisma.user.findMany({
          where: {
            OR: [
              {
                role: { in: ['WAREHOUSE_MANAGER', 'INVENTORY_CLERK'] },
                isActive: true,
              },
              {
                assignedWarehouses: {
                  some: {
                    warehouseId: itemEntry.warehouseId
                  }
                }
              }
            ]
          },
          select: { id: true }
        })
        usersToNotify = relevantUsers.map(u => u.id)
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
        referenceId: itemEntryId,
        referenceType: 'ITEM_ENTRY',
        isRead: false,
      }))

      await prisma.notification.createMany({
        data: notifications,
      })
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to create item entry notification:", error)
    return { success: false, error: "Failed to create item entry notification" }
  }
}

// Create transfer notifications
export async function createTransferNotification(
  transferId: string,
  action: 'CREATED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED',
  actionById?: string
) {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        createdBy: true,
        transferItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!transfer) {
      throw new Error("Transfer not found")
    }

    let title: string
    let message: string
    let type: NotificationType = NotificationType.INFO

    switch (action) {
      case 'CREATED':
        title = 'Transfer Created'
        message = `Transfer ${transfer.transferNumber} created: ${transfer.fromWarehouse.name} → ${transfer.toWarehouse.name}`
        type = NotificationType.INFO
        break
      case 'IN_TRANSIT':
        title = 'Transfer In Transit'
        message = `Transfer ${transfer.transferNumber} is now in transit`
        type = NotificationType.INFO
        break
      case 'COMPLETED':
        title = 'Transfer Completed'
        message = `Transfer ${transfer.transferNumber} has been completed successfully`
        type = NotificationType.SUCCESS
        break
      case 'CANCELLED':
        title = 'Transfer Cancelled'
        message = `Transfer ${transfer.transferNumber} has been cancelled`
        type = NotificationType.WARNING
        break
    }

    // Get users associated with both warehouses
    const usersToNotify = await prisma.user.findMany({
      where: {
        OR: [
          {
            assignedWarehouses: {
              some: {
                warehouseId: { in: [transfer.fromWarehouseId, transfer.toWarehouseId] }
              }
            }
          },
          {
            role: { in: ['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER'] },
            isActive: true,
          }
        ]
      },
      select: { id: true }
    })

    // Remove duplicates and exclude the person who triggered the action
    const uniqueUsers = [...new Set(usersToNotify.map(u => u.id))].filter(userId => userId !== actionById)

    if (uniqueUsers.length > 0) {
      const notifications = uniqueUsers.map(userId => ({
        title,
        message,
        type,
        userId,
        referenceId: transferId,
        referenceType: 'TRANSFER',
        isRead: false,
      }))

      await prisma.notification.createMany({
        data: notifications,
      })
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to create transfer notification:", error)
    return { success: false, error: "Failed to create transfer notification" }
  }
}

// Create withdrawal notifications
export async function createWithdrawalNotification(
  withdrawalId: string,
  action: 'CREATED' | 'COMPLETED' | 'CANCELLED',
  actionById?: string
) {
  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        warehouse: true,
        createdBy: true,
        withdrawalItems: {
          include: {
            item: true
          }
        }
      }
    })

    if (!withdrawal) {
      throw new Error("Withdrawal not found")
    }

    let title: string
    let message: string
    let type: NotificationType = NotificationType.INFO

    const itemCount = withdrawal.withdrawalItems.length

    switch (action) {
      case 'CREATED':
        title = 'Withdrawal Created'
        message = `Withdrawal ${withdrawal.withdrawalNumber} created: ${itemCount} item(s) from ${withdrawal.warehouse.name}`
        type = NotificationType.INFO
        break
      case 'COMPLETED':
        title = 'Withdrawal Completed'
        message = `Withdrawal ${withdrawal.withdrawalNumber} has been completed`
        type = NotificationType.SUCCESS
        break
      case 'CANCELLED':
        title = 'Withdrawal Cancelled'
        message = `Withdrawal ${withdrawal.withdrawalNumber} has been cancelled`
        type = NotificationType.WARNING
        break
    }

    // Get users associated with the warehouse
    const usersToNotify = await prisma.user.findMany({
      where: {
        OR: [
          {
            assignedWarehouses: {
              some: {
                warehouseId: withdrawal.warehouseId
              }
            }
          },
          {
            role: { in: ['ADMIN', 'SUPER_ADMIN', 'WAREHOUSE_MANAGER', 'INVENTORY_CLERK'] },
            isActive: true,
          }
        ]
      },
      select: { id: true }
    })

    // Remove duplicates and exclude the person who triggered the action
    const uniqueUsers = [...new Set(usersToNotify.map(u => u.id))].filter(userId => userId !== actionById)

    if (uniqueUsers.length > 0) {
      const notifications = uniqueUsers.map(userId => ({
        title,
        message,
        type,
        userId,
        referenceId: withdrawalId,
        referenceType: 'WITHDRAWAL',
        isRead: false,
      }))

      await prisma.notification.createMany({
        data: notifications,
      })
    }

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Failed to create withdrawal notification:", error)
    return { success: false, error: "Failed to create withdrawal notification" }
  }
}