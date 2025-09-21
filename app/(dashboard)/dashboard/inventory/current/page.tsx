import { Suspense } from "react"
import { getCurrentInventory, getWarehouses, getSuppliers } from "@/lib/actions/inventory-actions"
import { CurrentInventoryView } from "@/components/inventory/current-inventory-view"
import { Loader2 } from "lucide-react"

export default async function CurrentStockPage() {
  const [inventoryResult, warehousesResult, suppliersResult] = await Promise.allSettled([
    getCurrentInventory(),
    getWarehouses(),
    getSuppliers()
  ])

  const inventory = inventoryResult.status === 'fulfilled' && inventoryResult.value.success 
    ? inventoryResult.value.data || []
    : []

  const stats = inventoryResult.status === 'fulfilled' && inventoryResult.value.success 
    ? inventoryResult.value.stats
    : undefined

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  const suppliers = suppliersResult.status === 'fulfilled' && suppliersResult.value.success 
    ? suppliersResult.value.data || []
    : []

  if (inventoryResult.status === 'rejected' || !inventoryResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Inventory</h2>
          <p className="text-gray-600">
            {inventoryResult.status === 'fulfilled' ? inventoryResult.value.error : 'Failed to load inventory data'}
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
      <CurrentInventoryView 
        initialInventory={inventory}
        initialStats={stats}
        warehouses={warehouses}
        suppliers={suppliers}
      />
    </Suspense>
  )
}