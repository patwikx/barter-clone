import { Suspense } from "react"
import { getInventoryMovements, getWarehouses } from "@/lib/actions/inventory-actions"
import { InventoryMovementsView } from "@/components/inventory/inventory-movement-view"
import { Loader2 } from "lucide-react"

export default async function InventoryMovementsPage() {
  const [movementsResult, warehousesResult] = await Promise.allSettled([
    getInventoryMovements(),
    getWarehouses()
  ])

  const movements = movementsResult.status === 'fulfilled' && movementsResult.value.success 
    ? movementsResult.value.data || []
    : []

  const warehouses = warehousesResult.status === 'fulfilled' && warehousesResult.value.success 
    ? warehousesResult.value.data || []
    : []

  if (movementsResult.status === 'rejected' || !movementsResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Movements</h2>
          <p className="text-gray-600">
            {movementsResult.status === 'fulfilled' ? movementsResult.value.error : 'Failed to load movement data'}
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
      <InventoryMovementsView 
        initialMovements={movements}
        warehouses={warehouses}
      />
    </Suspense>
  )
}