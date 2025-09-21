import { Suspense } from "react"
import { getUsers } from "@/lib/actions/user-actions"

import { Loader2 } from "lucide-react"
import { UserManagement } from "@/components/users/user-management"

export default async function UsersPage() {
  const result = await getUsers()

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
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
      <UserManagement initialUsers={result.users || []} />
    </Suspense>
  )
}