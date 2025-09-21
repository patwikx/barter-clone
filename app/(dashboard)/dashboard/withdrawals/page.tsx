import { Suspense } from "react"
import { getWithdrawals } from "@/lib/actions/withdrawal-actions"
import { getWarehousesForTransfer } from "@/lib/actions/transfer-actions"
import { WithdrawalsView } from "@/components/withdrawals/withdrawals-view"
import { Loader2 } from "lucide-react"

export default async function WithdrawalsPage() {
  const [withdrawalsResult, warehousesResult] = await Promise.allSettled([
    getWithdrawals(),
    getWarehousesForTransfer()
  ])

  const withdrawals = withdrawalsResult.status === 'fulfilled' && withdrawalsResult.value.success 
    ? withdrawalsResult.value.data || []
    : []

  const stats = withdrawalsResult.status === 'fulfilled' && withdrawalsResult.value.success 
    ? withdrawalsResult.value.stats
    : undefined

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  if (withdrawalsResult.status === 'rejected' || !withdrawalsResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Withdrawals</h2>
          <p className="text-gray-600">
            {withdrawalsResult.status === 'fulfilled' ? withdrawalsResult.value.error : 'Failed to load withdrawal data'}
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
      <WithdrawalsView 
        initialWithdrawals={withdrawals}
        initialStats={stats}
        warehouses={warehouses}
      />
    </Suspense>
  )
}