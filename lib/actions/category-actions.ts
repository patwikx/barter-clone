"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { CostingMethodType, Prisma } from "@prisma/client"

export interface CategoryWithDetails {
  id: string
  name: string
  description: string | null
  code: string | null
  isActive: boolean
  requiresApproval: boolean
  defaultCostMethod: CostingMethodType
  parentCategoryId: string | null
  createdAt: Date
  updatedAt: Date
  parentCategory: {
    id: string
    name: string
    code: string | null
  } | null
  childCategories: Array<{
    id: string
    name: string
    code: string | null
  }>
  _count: {
    items: number
    childCategories: number
  }
}

export interface CreateCategoryInput {
  name: string
  description?: string
  code?: string
  isActive?: boolean
  requiresApproval?: boolean
  defaultCostMethod?: CostingMethodType
  parentCategoryId?: string
}

export interface UpdateCategoryInput {
  name?: string
  description?: string
  code?: string
  isActive?: boolean
  requiresApproval?: boolean
  defaultCostMethod?: CostingMethodType
  parentCategoryId?: string
}

export interface CategoryFilters {
  search: string
  parentCategoryId: string
  isActive: string
}

// Include type for category queries
const categoryInclude = {
  parentCategory: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  childCategories: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  _count: {
    select: {
      items: true,
      childCategories: true
    }
  }
} satisfies Prisma.ItemCategoryInclude

// Where clause type for category queries
interface CategoryWhereInput {
  OR?: Array<{
    name?: {
      contains: string
      mode: 'insensitive'
    }
    description?: {
      contains: string
      mode: 'insensitive'
    }
    code?: {
      contains: string
      mode: 'insensitive'
    }
  }>
  parentCategoryId?: string | null
  isActive?: boolean
}

// Get all categories with filters
export async function getCategories(
  filters: Partial<CategoryFilters> = {}
): Promise<{
  success: boolean
  data?: CategoryWithDetails[]
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const { search = "", parentCategoryId = "all", isActive = "all" } = filters

    // Build where clause
    const where: CategoryWhereInput = {}

    // Search filter
    if (search && search.trim() !== "") {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          code: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ]
    }

    // Parent category filter
    if (parentCategoryId === "root") {
      where.parentCategoryId = null
    } else if (parentCategoryId !== "all") {
      where.parentCategoryId = parentCategoryId
    }

    // Active status filter
    if (isActive === "true") {
      where.isActive = true
    } else if (isActive === "false") {
      where.isActive = false
    }

    const categories = await prisma.itemCategory.findMany({
      where,
      include: categoryInclude,
      orderBy: {
        name: 'asc'
      }
    })

    return {
      success: true,
      data: categories
    }

  } catch (error) {
    console.error('Error fetching categories:', error)
    return {
      success: false,
      error: 'Failed to fetch categories'
    }
  }
}

// Get category by ID
export async function getCategoryById(categoryId: string): Promise<{
  success: boolean
  data?: CategoryWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    const category = await prisma.itemCategory.findUnique({
      where: { id: categoryId },
      include: categoryInclude
    })

    if (!category) {
      return { success: false, error: "Category not found" }
    }

    return {
      success: true,
      data: category
    }

  } catch (error) {
    console.error('Error fetching category:', error)
    return {
      success: false,
      error: 'Failed to fetch category'
    }
  }
}

// Create new category
export async function createCategory(data: CreateCategoryInput): Promise<{
  success: boolean
  data?: CategoryWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if category name already exists
    const existingCategory = await prisma.itemCategory.findFirst({
      where: { 
        name: {
          equals: data.name,
          mode: 'insensitive'
        }
      }
    })

    if (existingCategory) {
      return { success: false, error: "Category name already exists" }
    }

    // Check if code already exists (if provided)
    if (data.code) {
      const existingCode = await prisma.itemCategory.findFirst({
        where: { 
          code: {
            equals: data.code,
            mode: 'insensitive'
          }
        }
      })

      if (existingCode) {
        return { success: false, error: "Category code already exists" }
      }
    }

    const category = await prisma.itemCategory.create({
      data: {
        name: data.name,
        description: data.description,
        code: data.code,
        isActive: data.isActive ?? true,
        requiresApproval: data.requiresApproval ?? false,
        defaultCostMethod: data.defaultCostMethod ?? CostingMethodType.WEIGHTED_AVERAGE,
        parentCategoryId: data.parentCategoryId
      },
      include: categoryInclude
    })

    revalidatePath('/dashboard/categories')
    
    return {
      success: true,
      data: category
    }

  } catch (error) {
    console.error('Error creating category:', error)
    return {
      success: false,
      error: 'Failed to create category'
    }
  }
}

// Update category
export async function updateCategory(categoryId: string, data: UpdateCategoryInput): Promise<{
  success: boolean
  data?: CategoryWithDetails
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if category name already exists (if updating name)
    if (data.name) {
      const existingCategory = await prisma.itemCategory.findFirst({
        where: {
          name: {
            equals: data.name,
            mode: 'insensitive'
          },
          NOT: { id: categoryId }
        }
      })

      if (existingCategory) {
        return { success: false, error: "Category name already exists" }
      }
    }

    // Check if code already exists (if updating code)
    if (data.code) {
      const existingCode = await prisma.itemCategory.findFirst({
        where: {
          code: {
            equals: data.code,
            mode: 'insensitive'
          },
          NOT: { id: categoryId }
        }
      })

      if (existingCode) {
        return { success: false, error: "Category code already exists" }
      }
    }

    const updateData: {
      name?: string
      description?: string | null
      code?: string | null
      isActive?: boolean
      requiresApproval?: boolean
      defaultCostMethod?: CostingMethodType
      parentCategoryId?: string | null
      updatedAt: Date
    } = {
      updatedAt: new Date()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.code !== undefined) updateData.code = data.code
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval
    if (data.defaultCostMethod !== undefined) updateData.defaultCostMethod = data.defaultCostMethod
    if (data.parentCategoryId !== undefined) updateData.parentCategoryId = data.parentCategoryId

    const category = await prisma.itemCategory.update({
      where: { id: categoryId },
      data: updateData,
      include: categoryInclude
    })

    revalidatePath('/dashboard/categories')
    revalidatePath(`/dashboard/categories/${categoryId}`)
    
    return {
      success: true,
      data: category
    }

  } catch (error) {
    console.error('Error updating category:', error)
    return {
      success: false,
      error: 'Failed to update category'
    }
  }
}

// Delete category
export async function deleteCategory(categoryId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" }
    }

    // Check if category has any items
    const hasItems = await prisma.item.findFirst({
      where: { categoryId },
      select: { id: true }
    })

    if (hasItems) {
      return { success: false, error: "Cannot delete category with existing items. Please reassign items to another category first." }
    }

    // Check if category has child categories
    const hasChildCategories = await prisma.itemCategory.findFirst({
      where: { parentCategoryId: categoryId },
      select: { id: true }
    })

    if (hasChildCategories) {
      return { success: false, error: "Cannot delete category with child categories. Please delete or reassign child categories first." }
    }

    await prisma.itemCategory.delete({
      where: { id: categoryId }
    })

    revalidatePath('/dashboard/categories')
    
    return { success: true }

  } catch (error) {
    console.error('Error deleting category:', error)
    return {
      success: false,
      error: 'Failed to delete category'
    }
  }
}

// Get categories for dropdown/selection
export async function getCategoriesForSelection(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    name: string
    code: string | null
    parentCategory: {
      name: string
    } | null
  }>
  error?: string
}> {
  try {
    const categories = await prisma.itemCategory.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        parentCategory: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return {
      success: true,
      data: categories
    }

  } catch (error) {
    console.error('Error fetching categories for selection:', error)
    return {
      success: false,
      error: 'Failed to fetch categories for selection'
    }
  }
}