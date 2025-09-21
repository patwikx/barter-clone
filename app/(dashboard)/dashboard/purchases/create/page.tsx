import { Suspense } from "react"
import { getSuppliersForPurchase, getItemsForPurchase } from "@/lib/actions/purchase-actions"
import { PurchaseCreateView } from "@/components/purchases/purchase-create-view"
import { Loader2 } from "lucide-react"

export default async function CreatePurchasePage() {
  const [suppliersResult, itemsResult] = await Promise.allSettled([
    getSuppliersForPurchase(),
    getItemsForPurchase()
  ])

  const suppliers = suppliersResult.status === 'fulfilled' && suppliersResult.value.success 
    ? suppliersResult.value.data || []
    : []

  const items = itemsResult.status === 'fulfilled' && itemsResult.value.success 
    ? itemsResult.value.data || []
    : []

  if (suppliersResult.status === 'rejected' || !suppliersResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">
            {suppliersResult.status === 'fulfilled' ? suppliersResult.value.error : 'Failed to load suppliers data'}
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
      <PurchaseCreateView 
        suppliers={suppliers}
        items={items}
      />
    </Suspense>
  )
}