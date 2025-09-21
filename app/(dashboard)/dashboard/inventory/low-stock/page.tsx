import { Suspense } from "react"
import { getLowStockItems, getWarehouses } from "@/lib/actions/inventory-actions"
import { LowStockView } from "@/components/inventory/low-stock-view"
import { Loader2 } from "lucide-react"

export default async function LowStockPage() {
  const [lowStockResult, warehousesResult] = await Promise.allSettled([
    getLowStockItems(),
    getWarehouses()
  ])

  const lowStockItems = lowStockResult.status === 'fulfilled' && lowStockResult.value.success 
    ? lowStockResult.value.data || []
    : []

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  if (lowStockResult.status === 'rejected' || !lowStockResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Low Stock Items</h2>
          <p className="text-gray-600">
            {lowStockResult.status === 'fulfilled' ? lowStockResult.value.error : 'Failed to load low stock data'}
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
      <LowStockView 
        initialLowStockItems={lowStockItems}
        warehouses={warehouses}
      />
    </Suspense>
  )
}