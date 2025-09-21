import { Suspense } from "react"
import { getSuppliers } from "@/lib/actions/supplier-actions"
import { SuppliersView } from "@/components/suppliers/supplier-view"
import { Loader2 } from "lucide-react"

export default async function SuppliersPage() {
  const result = await getSuppliers()

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Suppliers</h2>
          <p className="text-gray-600">{result.error}</p>
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
      <SuppliersView initialSuppliers={result.data || []} />
    </Suspense>
  )
}