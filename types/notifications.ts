// types/notifications.ts
export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'

export interface Notification {
  id: string
  title: string
  message: string
  type: NotificationType
  isRead: boolean
  createdAt: string
  referenceId?: string
  referenceType?: string
}

export interface NotificationData extends Notification {
  userId: string
}

export interface CreateNotificationRequest {
  title: string
  message: string
  type: NotificationType
  userId: string
  referenceId?: string
  referenceType?: string
}

export interface NotificationResponse {
  success: boolean
  error?: string
}

export interface GetNotificationsResponse extends NotificationResponse {
  notifications?: NotificationData[]
}

export interface GetUnreadCountResponse extends NotificationResponse {
  count?: number
}