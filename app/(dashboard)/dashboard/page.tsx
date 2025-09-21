import { Suspense } from "react"
import { getDashboardStats } from "@/lib/actions/dashboard-actions"

import { Loader2 } from "lucide-react"
import { DashboardView } from "@/components/dashbboard-view"

export default async function DashboardPage() {
  const statsResult = await getDashboardStats()

  const stats = statsResult.success ? statsResult.data : undefined

  if (!statsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600">
            {statsResult.error || 'Failed to load dashboard data'}
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
      <DashboardView initialStats={stats} />
    </Suspense>
  )
}