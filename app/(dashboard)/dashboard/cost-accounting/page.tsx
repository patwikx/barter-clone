import { Suspense } from "react"
import { getCostAccountingData } from "@/lib/actions/cost-accounting-actions"
import { CostAccountingView } from "@/components/cost-accounting/cost-accounting-view"
import { Loader2 } from "lucide-react"

export default async function CostAccountingPage() {
  const costResult = await getCostAccountingData()

  const costData = costResult.success 
    ? costResult.data
    : undefined

  if (!costResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Cost Data</h2>
          <p className="text-gray-600">
            {costResult.error || 'Failed to load cost accounting data'}
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
      <CostAccountingView initialData={costData} />
    </Suspense>
  )
}