import { Suspense } from "react"
import { getReportsData } from "@/lib/actions/reports-actions"
import { ReportsView } from "@/components/reports/reports-view"
import { Loader2 } from "lucide-react"

export default async function ReportsPage() {
  const reportsResult = await getReportsData()

  const reportsData = reportsResult.success 
    ? reportsResult.data
    : undefined

  if (!reportsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Reports</h2>
          <p className="text-gray-600">
            {reportsResult.error || 'Failed to load reports data'}
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
      <ReportsView initialData={reportsData} />
    </Suspense>
  )
}