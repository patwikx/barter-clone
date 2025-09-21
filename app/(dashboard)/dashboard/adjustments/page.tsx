import { Suspense } from "react"
import { getInventoryAdjustments } from "@/lib/actions/adjustments-actions"
import { getWarehousesForTransfer } from "@/lib/actions/transfer-actions"
import { AdjustmentsView } from "@/components/adjustments/adjustments-view"
import { Loader2 } from "lucide-react"

export default async function AdjustmentsPage() {
  const [adjustmentsResult, warehousesResult] = await Promise.allSettled([
    getInventoryAdjustments(),
    getWarehousesForTransfer()
  ])

  const adjustments = adjustmentsResult.status === 'fulfilled' && adjustmentsResult.value.success 
    ? adjustmentsResult.value.data || []
    : []

  const stats = adjustmentsResult.status === 'fulfilled' && adjustmentsResult.value.success 
    ? adjustmentsResult.value.stats
    : undefined

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  if (adjustmentsResult.status === 'rejected' || !adjustmentsResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Adjustments</h2>
          <p className="text-gray-600">
            {adjustmentsResult.status === 'fulfilled' ? adjustmentsResult.value.error : 'Failed to load adjustment data'}
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
      <AdjustmentsView 
        initialAdjustments={adjustments}
        initialStats={stats}
        warehouses={warehouses}
      />
    </Suspense>
  )
}