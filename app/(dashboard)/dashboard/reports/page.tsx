import { Suspense } from "react"
import { getReportsData } from "@/lib/actions/reports-actions"
import { ReportsView } from "@/components/reports/reports-view"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { Loader2 } from "lucide-react"

async function getWarehousesAndSuppliers() {
  const session = await auth()
  if (!session?.user?.id) {
    return { warehouses: [], suppliers: [] }
  }

  try {
    const [warehouses, suppliers] = await Promise.all([
      prisma.warehouse.findMany({
        select: {
          id: true,
          name: true,
          location: true
        },
        orderBy: { name: 'asc' }
      }),
      prisma.supplier.findMany({
        select: {
          id: true,
          name: true
        },
        orderBy: { name: 'asc' }
      })
    ])

    return { warehouses, suppliers }
  } catch (error) {
    console.error('Error fetching warehouses and suppliers:', error)
    return { warehouses: [], suppliers: [] }
  }
}

export default async function ReportsPage() {
  // Fetch all required data in parallel
  const [reportsResult, { warehouses, suppliers }] = await Promise.all([
    getReportsData(),
    getWarehousesAndSuppliers()
  ])

  const reportsData = reportsResult.success ? reportsResult.data : undefined

  if (!reportsResult.success) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Reports</h2>
          <p className="text-gray-600">
            {reportsResult.error || 'Failed to load reports data'}
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
      <ReportsView 
        initialData={reportsData} 
        warehouses={warehouses}
        suppliers={suppliers}
      />
    </Suspense>
  )
}