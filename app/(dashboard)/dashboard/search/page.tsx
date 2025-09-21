import { Suspense } from "react"
import { SearchView } from "@/components/search/search-view"
import { Loader2 } from "lucide-react"

export default async function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <SearchView />
    </Suspense>
  )
}