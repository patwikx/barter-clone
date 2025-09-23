import { Suspense } from "react"
import { getCategories } from "@/lib/actions/category-actions"
import { CategoriesView } from "@/components/categories/categories-view"
import { Loader2 } from "lucide-react"

export default async function CategoriesPage() {
  const categoriesResult = await getCategories()

  const categories = categoriesResult.success 
    ? categoriesResult.data || []
    : []

  if (!categoriesResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Categories</h2>
          <p className="text-gray-600">
            {categoriesResult.error || 'Failed to load categories'}
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
      <CategoriesView initialCategories={categories} />
    </Suspense>
  )
}