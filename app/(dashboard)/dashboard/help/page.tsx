import { Suspense } from "react"
import { HelpView } from "@/components/help/help-view"
import { Loader2 } from "lucide-react"

export default async function HelpPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    }>
      <HelpView />
    </Suspense>
  )
}