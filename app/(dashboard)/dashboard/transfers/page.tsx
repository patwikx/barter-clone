import { Suspense } from "react"
import { getTransfers, getWarehousesForTransfer } from "@/lib/actions/transfer-actions"
import { TransfersView } from "@/components/transfers/transfers-view"
import { Loader2 } from "lucide-react"

export default async function TransfersPage() {
  const [transfersResult, warehousesResult] = await Promise.allSettled([
    getTransfers(),
    getWarehousesForTransfer()
  ])

  const transfers = transfersResult.status === 'fulfilled' && transfersResult.value.success 
    ? transfersResult.value.data || []
    : []

  const stats = transfersResult.status === 'fulfilled' && transfersResult.value.success 
    ? transfersResult.value.stats
    : undefined

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  if (transfersResult.status === 'rejected' || !transfersResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Transfers</h2>
          <p className="text-gray-600">
            {transfersResult.status === 'fulfilled' ? transfersResult.value.error : 'Failed to load transfer data'}
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
      <TransfersView 
        initialTransfers={transfers}
        initialStats={stats}
        warehouses={warehouses}
      />
    </Suspense>
  )
}