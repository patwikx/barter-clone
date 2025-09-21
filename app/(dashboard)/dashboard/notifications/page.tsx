import { Suspense } from "react"
import { getUserNotifications } from "@/lib/actions/notifs"
import { NotificationsView } from "@/components/notifications/notifications-view"
import { Loader2 } from "lucide-react"

export default async function NotificationsPage() {
  const notificationsResult = await getUserNotifications(100)

  const notifications = notificationsResult.success 
    ? notificationsResult.notifications || []
    : []

  if (!notificationsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Notifications</h2>
          <p className="text-gray-600">
            {notificationsResult.error || 'Failed to load notifications'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <NotificationsView initialNotifications={notifications} />
    </Suspense>
  )
}