import { Suspense } from "react"
import { getItems } from "@/lib/actions/item-actions"
import { getSuppliers } from "@/lib/actions/supplier-actions"
import { ItemsView } from "@/components/items/items-view"
import { Loader2 } from "lucide-react"

export default async function ItemsPage() {
  const [itemsResult, suppliersResult] = await Promise.allSettled([
    getItems(),
    getSuppliers()
  ])

  const items = itemsResult.status === 'fulfilled' && itemsResult.value.success 
    ? itemsResult.value.data || []
    : []

  const suppliers = suppliersResult.status === 'fulfilled' && suppliersResult.value.success 
    ? suppliersResult.value.data || []
    : []

  if (itemsResult.status === 'rejected' || !itemsResult.value.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Items</h2>
          <p className="text-gray-600">
            {itemsResult.status === 'fulfilled' ? itemsResult.value.error : 'Failed to load items data'}
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
      <ItemsView 
        initialItems={items}
        suppliers={suppliers}
      />
    </Suspense>
  )
}