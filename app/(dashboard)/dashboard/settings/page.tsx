import { Suspense } from "react"
import { getSystemSettings } from "@/lib/actions/settings-actions"
import { SettingsView } from "@/components/settings/settings-view"
import { Loader2 } from "lucide-react"

export default async function SettingsPage() {
  const settingsResult = await getSystemSettings()

  const settings = settingsResult.success 
    ? settingsResult.data
    : undefined

  if (!settingsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Settings</h2>
          <p className="text-gray-600">
            {settingsResult.error || 'Failed to load system settings'}
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
      <SettingsView initialSettings={settings} />
    </Suspense>
  )
}