import { Suspense } from "react"
import { getPurchases, getSuppliersForPurchase } from "@/lib/actions/purchase-actions"
import { PurchasesView } from "@/components/purchases/purchases-view"
import { Loader2 } from "lucide-react"

export default async function PurchasesPage() {
  const [purchasesResult, suppliersResult] = await Promise.allSettled([
    getPurchases(),
    getSuppliersForPurchase()
  ])

  const purchases = purchasesResult.status === 'fulfilled' && purchasesResult.value.success 
    ? purchasesResult.value.data || []
    : []

  const stats = purchasesResult.status === 'fulfilled' && purchasesResult.value.success 
    ? purchasesResult.value.stats
    : undefined

  const suppliers = suppliersResult.status === 'fulfilled' && suppliersResult.value.success 
    ? suppliersResult.value.data || []
    : []

  if (purchasesResult.status === 'rejected' || !purchasesResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Purchases</h2>
          <p className="text-gray-600">
            {purchasesResult.status === 'fulfilled' ? purchasesResult.value.error : 'Failed to load purchase data'}
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
      <PurchasesView 
        initialPurchases={purchases}
        initialStats={stats}
        suppliers={suppliers}
      />
    </Suspense>
  )
}