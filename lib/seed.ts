import { PrismaClient, type Permission, type CostingMethodType, type UserRole } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Type definitions for better type safety
interface ItemData {
  itemCode: string
  description: string
  unitOfMeasure: string
  standardCost: number
  costingMethod: CostingMethodType
  reorderLevel: number
  maxLevel: number
  minLevel: number
  categoryId: string // Added category reference
}

interface SupplierData {
  name: string
  contactInfo: string
  purchaseReference: string
}

interface WarehouseData {
  name: string
  location: string
  description: string
  isMainWarehouse: boolean
  defaultCostingMethod: CostingMethodType
}

interface UserData {
  username: string
  email: string
  firstName: string
  lastName: string
  employeeId: string
  department: string
  position: string
  phone: string
  role: UserRole
}

// Helper function to generate random date within 2025
function getRandomDateIn2025(startMonth = 1, endMonth = 12): Date {
  const startDate = new Date(2025, startMonth - 1, 1)
  const endDate = new Date(2025, endMonth - 1, 28) // Use 28 to avoid month-end issues
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime())
  return new Date(randomTime)
}

// Helper function to generate random quantity
function getRandomQuantity(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper function to generate random cost variation
function getRandomCostVariation(baseCost: number, variationPercent = 0.1): number {
  const variation = baseCost * variationPercent * (Math.random() - 0.5) * 2
  return Math.max(baseCost + variation, baseCost * 0.5) // Ensure cost doesn't go below 50% of base
}

async function main() {
  console.log("🌱 Starting comprehensive seed process for 2025...")

  // Create comprehensive warehouse data
  console.log("📦 Creating warehouses...")
  const warehouseData: WarehouseData[] = [
    {
      name: "Manila Main Distribution Center",
      location: "Quezon City, Metro Manila",
      description: "Primary distribution hub for NCR and surrounding areas",
      isMainWarehouse: true,
      defaultCostingMethod: "WEIGHTED_AVERAGE",
    },
    {
      name: "Cebu Regional Warehouse",
      location: "Lapu-Lapu City, Cebu",
      description: "Central Visayas distribution center",
      isMainWarehouse: false,
      defaultCostingMethod: "WEIGHTED_AVERAGE",
    },
    {
      name: "Davao Southern Hub",
      location: "Davao City, Davao del Sur",
      description: "Mindanao regional distribution center",
      isMainWarehouse: false,
      defaultCostingMethod: "WEIGHTED_AVERAGE",
    },
    {
      name: "Baguio Cold Storage Facility",
      location: "Baguio City, Benguet",
      description: "Temperature-controlled storage for perishables",
      isMainWarehouse: false,
      defaultCostingMethod: "FIFO",
    },
    {
      name: "Clark Logistics Center",
      location: "Clark Freeport Zone, Pampanga",
      description: "Strategic logistics hub for Northern Luzon",
      isMainWarehouse: false,
      defaultCostingMethod: "WEIGHTED_AVERAGE",
    },
    {
      name: "Batangas Port Warehouse",
      location: "Batangas City, Batangas",
      description: "Import/export processing facility",
      isMainWarehouse: false,
      defaultCostingMethod: "WEIGHTED_AVERAGE",
    },
  ]

  const warehouses = await Promise.all(warehouseData.map((data) => prisma.warehouse.create({ data })))

  // Create comprehensive supplier data
  console.log("🏢 Creating suppliers...")
  const supplierData: SupplierData[] = [
    {
      name: "Manila Trading Corporation",
      contactInfo: "procurement@manilatrading.ph | +63-2-8123-4567 | Makati City",
      purchaseReference: "MTC",
    },
    {
      name: "Cebu Pacific Supplies Inc.",
      contactInfo: "orders@cebupacific.supplies | +63-32-456-7890 | Cebu City",
      purchaseReference: "CPS",
    },
    {
      name: "Davao Agricultural Products Co.",
      contactInfo: "sales@davaoagri.ph | +63-82-234-5678 | Davao City",
      purchaseReference: "DAP",
    },
    {
      name: "SM Business Solutions",
      contactInfo: "procurement@smbusiness.ph | +63-2-8789-0123 | Pasay City",
      purchaseReference: "SMBS",
    },
    {
      name: "Robinsons Industrial Supply",
      contactInfo: "orders@robinsons-industrial.ph | +63-2-8456-7890 | Ortigas",
      purchaseReference: "RIS",
    },
    {
      name: "Ayala Land Logistics",
      contactInfo: "logistics@ayalaland.com.ph | +63-2-8908-3000 | BGC",
      purchaseReference: "ALL",
    },
    {
      name: "JG Summit Holdings Supply Chain",
      contactInfo: "supply@jgsummit.com.ph | +63-2-8633-7777 | Mandaluyong",
      purchaseReference: "JGS",
    },
    {
      name: "Aboitiz Equity Ventures Trading",
      contactInfo: "trading@aboitiz.com | +63-32-411-1111 | Cebu City",
      purchaseReference: "AEV",
    },
    {
      name: "Petron Corporation Supplies",
      contactInfo: "supplies@petron.com | +63-2-8884-9200 | Makati City",
      purchaseReference: "PET",
    },
    {
      name: "PLDT Enterprise Solutions",
      contactInfo: "enterprise@pldt.com.ph | +63-2-8816-8888 | Makati City",
      purchaseReference: "PLDT",
    },
    {
      name: "Globe Business Supplies",
      contactInfo: "business@globe.com.ph | +63-2-7730-1000 | BGC",
      purchaseReference: "GLB",
    },
    {
      name: "Meralco Industrial Supply",
      contactInfo: "industrial@meralco.com.ph | +63-2-16211 | Ortigas",
      purchaseReference: "MER",
    },
  ]

  const suppliers = await Promise.all(supplierData.map((data) => prisma.supplier.create({ data })))

  // Create comprehensive user data
  console.log("👥 Creating users...")
  const userData: UserData[] = [
    {
      username: "admin",
      email: "admin@inventory.ph",
      firstName: "System",
      lastName: "Administrator",
      employeeId: "EMP001",
      department: "IT",
      position: "System Administrator",
      phone: "+63-2-8123-4567",
      role: "SUPER_ADMIN",
    },
    {
      username: "juan.dela.cruz",
      email: "juan@inventory.ph",
      firstName: "Juan",
      lastName: "Dela Cruz",
      employeeId: "EMP002",
      department: "Warehouse",
      position: "Warehouse Manager",
      phone: "+63-917-123-4567",
      role: "WAREHOUSE_MANAGER",
    },
    {
      username: "maria.santos",
      email: "maria@inventory.ph",
      firstName: "Maria",
      lastName: "Santos",
      employeeId: "EMP003",
      department: "Inventory",
      position: "Inventory Clerk",
      phone: "+63-918-234-5678",
      role: "INVENTORY_CLERK",
    },
    {
      username: "jose.rizal",
      email: "jose@inventory.ph",
      firstName: "Jose",
      lastName: "Rizal",
      employeeId: "EMP004",
      department: "Purchasing",
      position: "Purchase Officer",
      phone: "+63-919-345-6789",
      role: "PURCHASER",
    },
    {
      username: "andres.bonifacio",
      email: "andres@inventory.ph",
      firstName: "Andres",
      lastName: "Bonifacio",
      employeeId: "EMP005",
      department: "Warehouse",
      position: "Warehouse Supervisor",
      phone: "+63-920-456-7890",
      role: "WAREHOUSE_MANAGER",
    },
    {
      username: "gabriela.silang",
      email: "gabriela@inventory.ph",
      firstName: "Gabriela",
      lastName: "Silang",
      employeeId: "EMP006",
      department: "Quality Control",
      position: "QC Inspector",
      phone: "+63-921-567-8901",
      role: "INVENTORY_CLERK",
    },
    {
      username: "emilio.aguinaldo",
      email: "emilio@inventory.ph",
      firstName: "Emilio",
      lastName: "Aguinaldo",
      employeeId: "EMP007",
      department: "Operations",
      position: "Operations Manager",
      phone: "+63-922-678-9012",
      role: "ADMIN",
    },
    {
      username: "apolinario.mabini",
      email: "apolinario@inventory.ph",
      firstName: "Apolinario",
      lastName: "Mabini",
      employeeId: "EMP008",
      department: "Finance",
      position: "Cost Accountant",
      phone: "+63-923-789-0123",
      role: "USER",
    },
  ]

  const users = await Promise.all(
    userData.map(async (data) => {
      const passwordHash = await bcrypt.hash("password123", 10)
      return prisma.user.create({
        data: {
          ...data,
          passwordHash,
          defaultWarehouseId: warehouses[0].id,
          isActive: true,
          lastLoginAt: getRandomDateIn2025(1, 3),
        },
      })
    }),
  )

  // Admin gets special password
  await prisma.user.update({
    where: { id: users[0].id },
    data: { passwordHash: await bcrypt.hash("asdasd123", 10) },
  })

  console.log("📂 Creating item categories...")
  const categories = await Promise.all([
    prisma.itemCategory.create({
      data: {
        name: "Office Supplies",
        description: "General office and administrative supplies",
        code: "OFF",
        defaultCostMethod: "WEIGHTED_AVERAGE",
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: "Electronics",
        description: "Electronic devices and components",
        code: "ELE",
        defaultCostMethod: "SPECIFIC_IDENTIFICATION",
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: "Food & Beverages",
        description: "Food items and beverages",
        code: "FOD",
        defaultCostMethod: "FIFO",
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: "Construction Materials",
        description: "Building and construction supplies",
        code: "CON",
        defaultCostMethod: "WEIGHTED_AVERAGE",
      },
    }),
    prisma.itemCategory.create({
      data: {
        name: "Cleaning Supplies",
        description: "Cleaning and maintenance supplies",
        code: "CLN",
        defaultCostMethod: "WEIGHTED_AVERAGE",
      },
    }),
  ])

  const itemsData: ItemData[] = [
    // Office Supplies (ITEM-001 to ITEM-050)
    {
      itemCode: "ITEM-001",
      description: "A4 Bond Paper - 70gsm",
      unitOfMeasure: "REAM",
      standardCost: 250.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-002",
      description: "A4 Bond Paper - 80gsm",
      unitOfMeasure: "REAM",
      standardCost: 280.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-003",
      description: "Legal Size Bond Paper - 70gsm",
      unitOfMeasure: "REAM",
      standardCost: 270.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-004",
      description: "Ballpoint Pen - Blue",
      unitOfMeasure: "PIECE",
      standardCost: 15.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-005",
      description: "Ballpoint Pen - Black",
      unitOfMeasure: "PIECE",
      standardCost: 15.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-006",
      description: "Ballpoint Pen - Red",
      unitOfMeasure: "PIECE",
      standardCost: 15.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 150,
      maxLevel: 1500,
      minLevel: 75,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-007",
      description: "Pencil - HB",
      unitOfMeasure: "PIECE",
      standardCost: 8.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 300,
      maxLevel: 3000,
      minLevel: 150,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-008",
      description: "Pencil - 2B",
      unitOfMeasure: "PIECE",
      standardCost: 8.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 250,
      maxLevel: 2500,
      minLevel: 125,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-009",
      description: "Eraser - White",
      unitOfMeasure: "PIECE",
      standardCost: 5.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-010",
      description: "Ruler - 30cm",
      unitOfMeasure: "PIECE",
      standardCost: 25.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-011",
      description: "Stapler - Standard",
      unitOfMeasure: "PIECE",
      standardCost: 150.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-012",
      description: "Staple Wire - No. 10",
      unitOfMeasure: "BOX",
      standardCost: 35.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-013",
      description: "Paper Clips - Small",
      unitOfMeasure: "BOX",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-014",
      description: "Paper Clips - Large",
      unitOfMeasure: "BOX",
      standardCost: 55.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-015",
      description: "Binder Clips - 19mm",
      unitOfMeasure: "BOX",
      standardCost: 65.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-016",
      description: "Binder Clips - 25mm",
      unitOfMeasure: "BOX",
      standardCost: 75.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 18,
      maxLevel: 180,
      minLevel: 9,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-017",
      description: "Highlighter - Yellow",
      unitOfMeasure: "PIECE",
      standardCost: 35.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-018",
      description: "Highlighter - Pink",
      unitOfMeasure: "PIECE",
      standardCost: 35.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 80,
      maxLevel: 800,
      minLevel: 40,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-019",
      description: "Highlighter - Green",
      unitOfMeasure: "PIECE",
      standardCost: 35.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 70,
      maxLevel: 700,
      minLevel: 35,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-020",
      description: "Marker - Black",
      unitOfMeasure: "PIECE",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 60,
      maxLevel: 600,
      minLevel: 30,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-021",
      description: "Marker - Blue",
      unitOfMeasure: "PIECE",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-022",
      description: "Marker - Red",
      unitOfMeasure: "PIECE",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 45,
      maxLevel: 450,
      minLevel: 22,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-023",
      description: "Correction Tape",
      unitOfMeasure: "PIECE",
      standardCost: 55.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-024",
      description: "Correction Fluid",
      unitOfMeasure: "BOTTLE",
      standardCost: 25.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 60,
      maxLevel: 600,
      minLevel: 30,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-025",
      description: "Glue Stick - 21g",
      unitOfMeasure: "PIECE",
      standardCost: 40.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-026",
      description: "White Glue - 50ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 30.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 70,
      maxLevel: 700,
      minLevel: 35,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-027",
      description: "Scissors - 8 inch",
      unitOfMeasure: "PIECE",
      standardCost: 120.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-028",
      description: "Cutter - Small",
      unitOfMeasure: "PIECE",
      standardCost: 35.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-029",
      description: "Cutter Blade Refill",
      unitOfMeasure: "PACK",
      standardCost: 25.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-030",
      description: "Tape Dispenser",
      unitOfMeasure: "PIECE",
      standardCost: 85.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 15,
      maxLevel: 150,
      minLevel: 7,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-031",
      description: "Scotch Tape - 24mm",
      unitOfMeasure: "ROLL",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-032",
      description: "Masking Tape - 24mm",
      unitOfMeasure: "ROLL",
      standardCost: 35.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-033",
      description: "Double-sided Tape",
      unitOfMeasure: "ROLL",
      standardCost: 65.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-034",
      description: "Manila Folder - Legal",
      unitOfMeasure: "PIECE",
      standardCost: 8.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-035",
      description: "Manila Folder - A4",
      unitOfMeasure: "PIECE",
      standardCost: 7.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 250,
      maxLevel: 2500,
      minLevel: 125,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-036",
      description: "Expanding File - 13 Pockets",
      unitOfMeasure: "PIECE",
      standardCost: 180.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 10,
      maxLevel: 100,
      minLevel: 5,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-037",
      description: "Ring Binder - 2 inch",
      unitOfMeasure: "PIECE",
      standardCost: 95.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-038",
      description: "Ring Binder - 1 inch",
      unitOfMeasure: "PIECE",
      standardCost: 75.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-039",
      description: "Plastic Sleeve - A4",
      unitOfMeasure: "PACK",
      standardCost: 85.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-040",
      description: "Index Divider - 5 Tabs",
      unitOfMeasure: "SET",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-041",
      description: "Sticky Notes - 3x3",
      unitOfMeasure: "PAD",
      standardCost: 25.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-042",
      description: "Sticky Notes - 1.5x2",
      unitOfMeasure: "PAD",
      standardCost: 15.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 120,
      maxLevel: 1200,
      minLevel: 60,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-043",
      description: "Calculator - Basic",
      unitOfMeasure: "PIECE",
      standardCost: 250.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 10,
      maxLevel: 100,
      minLevel: 5,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-044",
      description: "Calculator - Scientific",
      unitOfMeasure: "PIECE",
      standardCost: 850.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 5,
      maxLevel: 50,
      minLevel: 2,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-045",
      description: "Desk Organizer - 4 Compartments",
      unitOfMeasure: "PIECE",
      standardCost: 320.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 8,
      maxLevel: 80,
      minLevel: 4,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-046",
      description: "Paper Tray - 3 Tier",
      unitOfMeasure: "PIECE",
      standardCost: 450.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 6,
      maxLevel: 60,
      minLevel: 3,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-047",
      description: "Hole Puncher - 2 Holes",
      unitOfMeasure: "PIECE",
      standardCost: 180.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 12,
      maxLevel: 120,
      minLevel: 6,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-048",
      description: "Paper Shredder - Cross Cut",
      unitOfMeasure: "PIECE",
      standardCost: 2500.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 2,
      maxLevel: 20,
      minLevel: 1,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-049",
      description: "Laminating Pouches - A4",
      unitOfMeasure: "PACK",
      standardCost: 180.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 15,
      maxLevel: 150,
      minLevel: 7,
      categoryId: categories[0].id,
    },
    {
      itemCode: "ITEM-050",
      description: "ID Lace - Retractable",
      unitOfMeasure: "PIECE",
      standardCost: 65.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[0].id,
    },

    // Electronics (ITEM-051 to ITEM-090)
    {
      itemCode: "ITEM-051",
      description: "USB Flash Drive - 32GB",
      unitOfMeasure: "PIECE",
      standardCost: 450.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-052",
      description: "USB Flash Drive - 64GB",
      unitOfMeasure: "PIECE",
      standardCost: 750.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-053",
      description: "USB Flash Drive - 128GB",
      unitOfMeasure: "PIECE",
      standardCost: 1200.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-054",
      description: "Wireless Mouse",
      unitOfMeasure: "PIECE",
      standardCost: 850.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-055",
      description: "Wired Mouse",
      unitOfMeasure: "PIECE",
      standardCost: 450.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 35,
      maxLevel: 350,
      minLevel: 17,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-056",
      description: "Wireless Keyboard",
      unitOfMeasure: "PIECE",
      standardCost: 1200.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-057",
      description: "Wired Keyboard",
      unitOfMeasure: "PIECE",
      standardCost: 750.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-058",
      description: "USB Cable - Type A to Type B",
      unitOfMeasure: "PIECE",
      standardCost: 180.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-059",
      description: "USB Cable - Type A to Micro USB",
      unitOfMeasure: "PIECE",
      standardCost: 120.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 60,
      maxLevel: 600,
      minLevel: 30,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-060",
      description: "USB Cable - Type A to Type C",
      unitOfMeasure: "PIECE",
      standardCost: 150.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 55,
      maxLevel: 550,
      minLevel: 27,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-061",
      description: "HDMI Cable - 1.5m",
      unitOfMeasure: "PIECE",
      standardCost: 320.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-062",
      description: "HDMI Cable - 3m",
      unitOfMeasure: "PIECE",
      standardCost: 480.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-063",
      description: "VGA Cable - 1.5m",
      unitOfMeasure: "PIECE",
      standardCost: 250.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 35,
      maxLevel: 350,
      minLevel: 17,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-064",
      description: "Power Strip - 4 Outlets",
      unitOfMeasure: "PIECE",
      standardCost: 450.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-065",
      description: "Power Strip - 6 Outlets",
      unitOfMeasure: "PIECE",
      standardCost: 650.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-066",
      description: "Extension Cord - 5m",
      unitOfMeasure: "PIECE",
      standardCost: 380.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-067",
      description: "Extension Cord - 10m",
      unitOfMeasure: "PIECE",
      standardCost: 650.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-068",
      description: "Webcam - 720p",
      unitOfMeasure: "PIECE",
      standardCost: 1500.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 15,
      maxLevel: 150,
      minLevel: 7,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-069",
      description: "Webcam - 1080p",
      unitOfMeasure: "PIECE",
      standardCost: 2500.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 10,
      maxLevel: 100,
      minLevel: 5,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-070",
      description: "Headphones - Wired",
      unitOfMeasure: "PIECE",
      standardCost: 850.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-071",
      description: "Headphones - Wireless",
      unitOfMeasure: "PIECE",
      standardCost: 1800.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 15,
      maxLevel: 150,
      minLevel: 7,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-072",
      description: "Speakers - 2.1 System",
      unitOfMeasure: "SET",
      standardCost: 2200.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 10,
      maxLevel: 100,
      minLevel: 5,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-073",
      description: "Microphone - USB",
      unitOfMeasure: "PIECE",
      standardCost: 1200.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 12,
      maxLevel: 120,
      minLevel: 6,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-074",
      description: "Monitor Stand - Adjustable",
      unitOfMeasure: "PIECE",
      standardCost: 950.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 15,
      maxLevel: 150,
      minLevel: 7,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-075",
      description: "Laptop Cooling Pad",
      unitOfMeasure: "PIECE",
      standardCost: 750.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-076",
      description: "USB Hub - 4 Port",
      unitOfMeasure: "PIECE",
      standardCost: 450.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-077",
      description: "USB Hub - 7 Port",
      unitOfMeasure: "PIECE",
      standardCost: 750.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 18,
      maxLevel: 180,
      minLevel: 9,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-078",
      description: "Card Reader - Multi-format",
      unitOfMeasure: "PIECE",
      standardCost: 320.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-079",
      description: "External Hard Drive - 1TB",
      unitOfMeasure: "PIECE",
      standardCost: 3500.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 8,
      maxLevel: 80,
      minLevel: 4,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-080",
      description: "External Hard Drive - 2TB",
      unitOfMeasure: "PIECE",
      standardCost: 5500.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 5,
      maxLevel: 50,
      minLevel: 2,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-081",
      description: "SSD External - 500GB",
      unitOfMeasure: "PIECE",
      standardCost: 4200.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 6,
      maxLevel: 60,
      minLevel: 3,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-082",
      description: "Network Cable - Cat6 - 3m",
      unitOfMeasure: "PIECE",
      standardCost: 180.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-083",
      description: "Network Cable - Cat6 - 5m",
      unitOfMeasure: "PIECE",
      standardCost: 250.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 35,
      maxLevel: 350,
      minLevel: 17,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-084",
      description: "WiFi Router - Dual Band",
      unitOfMeasure: "PIECE",
      standardCost: 2800.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 8,
      maxLevel: 80,
      minLevel: 4,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-085",
      description: "Network Switch - 8 Port",
      unitOfMeasure: "PIECE",
      standardCost: 1500.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 10,
      maxLevel: 100,
      minLevel: 5,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-086",
      description: "UPS - 650VA",
      unitOfMeasure: "PIECE",
      standardCost: 3200.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 6,
      maxLevel: 60,
      minLevel: 3,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-087",
      description: "UPS - 1000VA",
      unitOfMeasure: "PIECE",
      standardCost: 4800.0,
      costingMethod: "SPECIFIC_IDENTIFICATION",
      reorderLevel: 4,
      maxLevel: 40,
      minLevel: 2,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-088",
      description: "Surge Protector - 6 Outlets",
      unitOfMeasure: "PIECE",
      standardCost: 850.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 15,
      maxLevel: 150,
      minLevel: 7,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-089",
      description: "Cable Management Tray",
      unitOfMeasure: "PIECE",
      standardCost: 450.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[1].id,
    },
    {
      itemCode: "ITEM-090",
      description: "Monitor Arm - Single",
      unitOfMeasure: "PIECE",
      standardCost: 1200.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 12,
      maxLevel: 120,
      minLevel: 6,
      categoryId: categories[1].id,
    },

    // Food & Beverages (ITEM-091 to ITEM-125)
    {
      itemCode: "ITEM-091",
      description: "Instant Coffee - 3-in-1",
      unitOfMeasure: "SACHET",
      standardCost: 8.0,
      costingMethod: "FIFO",
      reorderLevel: 500,
      maxLevel: 5000,
      minLevel: 250,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-092",
      description: "Instant Coffee - Black",
      unitOfMeasure: "SACHET",
      standardCost: 6.0,
      costingMethod: "FIFO",
      reorderLevel: 400,
      maxLevel: 4000,
      minLevel: 200,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-093",
      description: "Tea Bags - English Breakfast",
      unitOfMeasure: "SACHET",
      standardCost: 5.0,
      costingMethod: "FIFO",
      reorderLevel: 300,
      maxLevel: 3000,
      minLevel: 150,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-094",
      description: "Tea Bags - Green Tea",
      unitOfMeasure: "SACHET",
      standardCost: 6.0,
      costingMethod: "FIFO",
      reorderLevel: 250,
      maxLevel: 2500,
      minLevel: 125,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-095",
      description: "Hot Chocolate Mix",
      unitOfMeasure: "SACHET",
      standardCost: 12.0,
      costingMethod: "FIFO",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-096",
      description: "Sugar - White - 1kg",
      unitOfMeasure: "PACK",
      standardCost: 65.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-097",
      description: "Sugar - Brown - 1kg",
      unitOfMeasure: "PACK",
      standardCost: 75.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-098",
      description: "Creamer - Powdered",
      unitOfMeasure: "PACK",
      standardCost: 85.0,
      costingMethod: "FIFO",
      reorderLevel: 60,
      maxLevel: 600,
      minLevel: 30,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-099",
      description: "Biscuits - Crackers",
      unitOfMeasure: "PACK",
      standardCost: 45.0,
      costingMethod: "FIFO",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-100",
      description: "Biscuits - Sandwich",
      unitOfMeasure: "PACK",
      standardCost: 35.0,
      costingMethod: "FIFO",
      reorderLevel: 120,
      maxLevel: 1200,
      minLevel: 60,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-101",
      description: "Cookies - Chocolate Chip",
      unitOfMeasure: "PACK",
      standardCost: 55.0,
      costingMethod: "FIFO",
      reorderLevel: 80,
      maxLevel: 800,
      minLevel: 40,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-102",
      description: "Instant Noodles - Chicken",
      unitOfMeasure: "PACK",
      standardCost: 18.0,
      costingMethod: "FIFO",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-103",
      description: "Instant Noodles - Beef",
      unitOfMeasure: "PACK",
      standardCost: 18.0,
      costingMethod: "FIFO",
      reorderLevel: 180,
      maxLevel: 1800,
      minLevel: 90,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-104",
      description: "Instant Noodles - Seafood",
      unitOfMeasure: "PACK",
      standardCost: 20.0,
      costingMethod: "FIFO",
      reorderLevel: 150,
      maxLevel: 1500,
      minLevel: 75,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-105",
      description: "Canned Tuna - 155g",
      unitOfMeasure: "CAN",
      standardCost: 45.0,
      costingMethod: "FIFO",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-106",
      description: "Canned Sardines - 155g",
      unitOfMeasure: "CAN",
      standardCost: 25.0,
      costingMethod: "FIFO",
      reorderLevel: 150,
      maxLevel: 1500,
      minLevel: 75,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-107",
      description: "Canned Corned Beef - 150g",
      unitOfMeasure: "CAN",
      standardCost: 65.0,
      costingMethod: "FIFO",
      reorderLevel: 80,
      maxLevel: 800,
      minLevel: 40,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-108",
      description: "Bottled Water - 500ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 15.0,
      costingMethod: "FIFO",
      reorderLevel: 500,
      maxLevel: 5000,
      minLevel: 250,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-109",
      description: "Bottled Water - 1L",
      unitOfMeasure: "BOTTLE",
      standardCost: 25.0,
      costingMethod: "FIFO",
      reorderLevel: 300,
      maxLevel: 3000,
      minLevel: 150,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-110",
      description: "Soft Drinks - Cola - 330ml",
      unitOfMeasure: "CAN",
      standardCost: 35.0,
      costingMethod: "FIFO",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-111",
      description: "Soft Drinks - Lemon - 330ml",
      unitOfMeasure: "CAN",
      standardCost: 35.0,
      costingMethod: "FIFO",
      reorderLevel: 180,
      maxLevel: 1800,
      minLevel: 90,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-112",
      description: "Fruit Juice - Orange - 250ml",
      unitOfMeasure: "TETRAPACK",
      standardCost: 28.0,
      costingMethod: "FIFO",
      reorderLevel: 150,
      maxLevel: 1500,
      minLevel: 75,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-113",
      description: "Fruit Juice - Apple - 250ml",
      unitOfMeasure: "TETRAPACK",
      standardCost: 28.0,
      costingMethod: "FIFO",
      reorderLevel: 140,
      maxLevel: 1400,
      minLevel: 70,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-114",
      description: "Energy Drink - 250ml",
      unitOfMeasure: "CAN",
      standardCost: 55.0,
      costingMethod: "FIFO",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-115",
      description: "Sports Drink - 500ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 45.0,
      costingMethod: "FIFO",
      reorderLevel: 120,
      maxLevel: 1200,
      minLevel: 60,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-116",
      description: "Milk - UHT - 1L",
      unitOfMeasure: "TETRAPACK",
      standardCost: 85.0,
      costingMethod: "FIFO",
      reorderLevel: 60,
      maxLevel: 600,
      minLevel: 30,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-117",
      description: "Yogurt - Plain - 150g",
      unitOfMeasure: "CUP",
      standardCost: 35.0,
      costingMethod: "FIFO",
      reorderLevel: 80,
      maxLevel: 800,
      minLevel: 40,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-118",
      description: "Yogurt - Strawberry - 150g",
      unitOfMeasure: "CUP",
      standardCost: 38.0,
      costingMethod: "FIFO",
      reorderLevel: 75,
      maxLevel: 750,
      minLevel: 37,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-119",
      description: "Bread - White Loaf",
      unitOfMeasure: "LOAF",
      standardCost: 45.0,
      costingMethod: "FIFO",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-120",
      description: "Bread - Wheat Loaf",
      unitOfMeasure: "LOAF",
      standardCost: 55.0,
      costingMethod: "FIFO",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-121",
      description: "Cereal - Corn Flakes",
      unitOfMeasure: "BOX",
      standardCost: 185.0,
      costingMethod: "FIFO",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-122",
      description: "Cereal - Oats",
      unitOfMeasure: "BOX",
      standardCost: 165.0,
      costingMethod: "FIFO",
      reorderLevel: 35,
      maxLevel: 350,
      minLevel: 17,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-123",
      description: "Peanut Butter - 340g",
      unitOfMeasure: "JAR",
      standardCost: 125.0,
      costingMethod: "FIFO",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-124",
      description: "Jam - Strawberry - 340g",
      unitOfMeasure: "JAR",
      standardCost: 95.0,
      costingMethod: "FIFO",
      reorderLevel: 45,
      maxLevel: 450,
      minLevel: 22,
      categoryId: categories[2].id,
    },
    {
      itemCode: "ITEM-125",
      description: "Honey - 250g",
      unitOfMeasure: "BOTTLE",
      standardCost: 185.0,
      costingMethod: "FIFO",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[2].id,
    },

    // Construction Materials (ITEM-126 to ITEM-150)
    {
      itemCode: "ITEM-126",
      description: "Cement - Portland",
      unitOfMeasure: "BAG",
      standardCost: 285.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-127",
      description: "Sand - Fine",
      unitOfMeasure: "CUBIC_METER",
      standardCost: 850.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-128",
      description: "Sand - Coarse",
      unitOfMeasure: "CUBIC_METER",
      standardCost: 900.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 18,
      maxLevel: 180,
      minLevel: 9,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-129",
      description: "Gravel - 3/4 inch",
      unitOfMeasure: "CUBIC_METER",
      standardCost: 1200.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 15,
      maxLevel: 150,
      minLevel: 7,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-130",
      description: "Gravel - 1/2 inch",
      unitOfMeasure: "CUBIC_METER",
      standardCost: 1150.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 16,
      maxLevel: 160,
      minLevel: 8,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-131",
      description: "Rebar - 10mm x 6m",
      unitOfMeasure: "PIECE",
      standardCost: 185.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 200,
      maxLevel: 2000,
      minLevel: 100,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-132",
      description: "Rebar - 12mm x 6m",
      unitOfMeasure: "PIECE",
      standardCost: 265.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 150,
      maxLevel: 1500,
      minLevel: 75,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-133",
      description: "Rebar - 16mm x 6m",
      unitOfMeasure: "PIECE",
      standardCost: 465.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-134",
      description: "Hollow Blocks - 4 inch",
      unitOfMeasure: "PIECE",
      standardCost: 18.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 500,
      maxLevel: 5000,
      minLevel: 250,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-135",
      description: "Hollow Blocks - 6 inch",
      unitOfMeasure: "PIECE",
      standardCost: 25.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 400,
      maxLevel: 4000,
      minLevel: 200,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-136",
      description: "Roofing Sheets - GI - 8ft",
      unitOfMeasure: "SHEET",
      standardCost: 485.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-137",
      description: "Roofing Sheets - GI - 10ft",
      unitOfMeasure: "SHEET",
      standardCost: 605.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-138",
      description: "Plywood - 1/4 inch - 4x8",
      unitOfMeasure: "SHEET",
      standardCost: 850.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-139",
      description: "Plywood - 1/2 inch - 4x8",
      unitOfMeasure: "SHEET",
      standardCost: 1450.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-140",
      description: "Lumber - 2x2 x 8ft",
      unitOfMeasure: "PIECE",
      standardCost: 125.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-141",
      description: "Lumber - 2x4 x 8ft",
      unitOfMeasure: "PIECE",
      standardCost: 245.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 80,
      maxLevel: 800,
      minLevel: 40,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-142",
      description: "Nails - Common - 2 inch",
      unitOfMeasure: "KILO",
      standardCost: 85.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-143",
      description: "Nails - Common - 3 inch",
      unitOfMeasure: "KILO",
      standardCost: 90.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 45,
      maxLevel: 450,
      minLevel: 22,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-144",
      description: "Screws - Wood - 2 inch",
      unitOfMeasure: "BOX",
      standardCost: 125.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-145",
      description: "Screws - Metal - 1 inch",
      unitOfMeasure: "BOX",
      standardCost: 145.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 35,
      maxLevel: 350,
      minLevel: 17,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-146",
      description: "Paint - Latex - White - 1L",
      unitOfMeasure: "CAN",
      standardCost: 385.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-147",
      description: "Paint - Latex - Colored - 1L",
      unitOfMeasure: "CAN",
      standardCost: 425.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-148",
      description: "Paint Brush - 2 inch",
      unitOfMeasure: "PIECE",
      standardCost: 85.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-149",
      description: "Paint Roller - 9 inch",
      unitOfMeasure: "PIECE",
      standardCost: 125.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[3].id,
    },
    {
      itemCode: "ITEM-150",
      description: "Sandpaper - 120 Grit",
      unitOfMeasure: "SHEET",
      standardCost: 15.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[3].id,
    },

    // Cleaning Supplies (ITEM-151 to ITEM-165)
    {
      itemCode: "ITEM-151",
      description: "All-Purpose Cleaner - 500ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 85.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-152",
      description: "Glass Cleaner - 500ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 95.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-153",
      description: "Floor Cleaner - 1L",
      unitOfMeasure: "BOTTLE",
      standardCost: 125.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 35,
      maxLevel: 350,
      minLevel: 17,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-154",
      description: "Toilet Bowl Cleaner - 500ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 115.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-155",
      description: "Dishwashing Liquid - 500ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 65.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 60,
      maxLevel: 600,
      minLevel: 30,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-156",
      description: "Laundry Detergent - Powder - 1kg",
      unitOfMeasure: "BOX",
      standardCost: 185.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 25,
      maxLevel: 250,
      minLevel: 12,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-157",
      description: "Fabric Softener - 1L",
      unitOfMeasure: "BOTTLE",
      standardCost: 145.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 20,
      maxLevel: 200,
      minLevel: 10,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-158",
      description: "Bleach - 1L",
      unitOfMeasure: "BOTTLE",
      standardCost: 75.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-159",
      description: "Disinfectant Spray - 400ml",
      unitOfMeasure: "CAN",
      standardCost: 165.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 30,
      maxLevel: 300,
      minLevel: 15,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-160",
      description: "Hand Soap - Liquid - 250ml",
      unitOfMeasure: "BOTTLE",
      standardCost: 85.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-161",
      description: "Paper Towels - 2 Ply",
      unitOfMeasure: "ROLL",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 100,
      maxLevel: 1000,
      minLevel: 50,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-162",
      description: "Toilet Paper - 2 Ply",
      unitOfMeasure: "ROLL",
      standardCost: 35.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 150,
      maxLevel: 1500,
      minLevel: 75,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-163",
      description: "Trash Bags - Large",
      unitOfMeasure: "PACK",
      standardCost: 125.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 40,
      maxLevel: 400,
      minLevel: 20,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-164",
      description: "Trash Bags - Small",
      unitOfMeasure: "PACK",
      standardCost: 85.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 50,
      maxLevel: 500,
      minLevel: 25,
      categoryId: categories[4].id,
    },
    {
      itemCode: "ITEM-165",
      description: "Microfiber Cloth - 30x30cm",
      unitOfMeasure: "PIECE",
      standardCost: 45.0,
      costingMethod: "WEIGHTED_AVERAGE",
      reorderLevel: 60,
      maxLevel: 600,
      minLevel: 30,
      categoryId: categories[4].id,
    },
  ]

  console.log("📦 Creating items...")
  const items = await Promise.all(
    itemsData.map((data) =>
      prisma.item.create({
        data: {
          ...data,
          supplierId: suppliers[Math.floor(Math.random() * suppliers.length)].id,
        },
      }),
    ),
  )

  // Assign user permissions
  console.log("🔐 Assigning user permissions...")
  const allPermissions: Permission[] = [
    "CREATE_ITEMS",
    "UPDATE_ITEMS",
    "DELETE_ITEMS",
    "VIEW_ITEMS",
    "CREATE_ITEM_ENTRIES",
    "VIEW_ITEM_ENTRIES",
    "CREATE_TRANSFERS",
    "VIEW_TRANSFERS",
    "CANCEL_TRANSFERS",
    "CREATE_WITHDRAWALS",
    "VIEW_WITHDRAWALS",
    "CANCEL_WITHDRAWALS",
    "ADJUST_INVENTORY",
    "VIEW_INVENTORY",
    "RECOUNT_INVENTORY",
    "VIEW_REPORTS",
    "EXPORT_REPORTS",
    "VIEW_COST_REPORTS",
    "MANAGE_USERS",
    "MANAGE_WAREHOUSES",
    "MANAGE_SUPPLIERS",
    "VIEW_AUDIT_LOGS",
    "SYSTEM_SETTINGS",
  ]

  // Admin gets all permissions
  for (const permission of allPermissions) {
    await prisma.userPermission.create({
      data: {
        userId: users[0].id,
        permission: permission,
        grantedBy: "SYSTEM",
      },
    })
  }

  // Create user-warehouse assignments
  console.log("🏭 Creating user-warehouse assignments...")
  const userWarehouseAssignments = [
    { userId: users[0].id, warehouseId: warehouses[0].id, role: "MANAGER" as const },
    { userId: users[1].id, warehouseId: warehouses[0].id, role: "MANAGER" as const },
    { userId: users[2].id, warehouseId: warehouses[1].id, role: "CLERK" as const },
    { userId: users[3].id, warehouseId: warehouses[2].id, role: "SUPERVISOR" as const },
    { userId: users[4].id, warehouseId: warehouses[3].id, role: "SUPERVISOR" as const },
    { userId: users[5].id, warehouseId: warehouses[4].id, role: "CLERK" as const },
    { userId: users[6].id, warehouseId: warehouses[5].id, role: "MANAGER" as const },
    { userId: users[7].id, warehouseId: warehouses[0].id, role: "VIEWER" as const },
  ]

  await Promise.all(userWarehouseAssignments.map((data) => prisma.userWarehouse.create({ data })))

  // Generate comprehensive item entries for the entire year 2025
  console.log("📦 Creating comprehensive item entries for 2025...")
  const itemEntries = []

  // Generate entries for each month of 2025
  for (let month = 1; month <= 12; month++) {
    // Generate 15-25 entries per month per warehouse
    const entriesPerWarehouse = getRandomQuantity(15, 25)

    for (let warehouseIndex = 0; warehouseIndex < warehouses.length; warehouseIndex++) {
      for (let entryIndex = 0; entryIndex < entriesPerWarehouse; entryIndex++) {
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const randomSupplier = suppliers[Math.floor(Math.random() * suppliers.length)]
        const randomUser = users[Math.floor(Math.random() * users.length)]

        const baseQuantity = getRandomQuantity(10, 500)
        const baseCost = getRandomCostVariation(Number(randomItem.standardCost), 0.15)

        itemEntries.push({
          itemId: randomItem.id,
          warehouseId: warehouses[warehouseIndex].id,
          supplierId: randomSupplier.id,
          quantity: baseQuantity,
          landedCost: baseCost,
          totalValue: baseQuantity * baseCost,
          purchaseReference: `PO-2025-${String(month).padStart(2, "0")}-${String(entryIndex + 1).padStart(3, "0")}`,
          createdById: randomUser.id,
          entryDate: getRandomDateIn2025(month, month),
          notes: `Monthly procurement - ${month}/${2025}`,
        })
      }
    }
  }

  // Create item entries in batches
  const batchSize = 100
  for (let i = 0; i < itemEntries.length; i += batchSize) {
    const batch = itemEntries.slice(i, i + batchSize)
    await Promise.all(batch.map((entry) => prisma.itemEntry.create({ data: entry })))
    console.log(`Created ${Math.min(i + batchSize, itemEntries.length)} / ${itemEntries.length} item entries`)
  }

  // Generate transfers throughout 2025
  console.log("🚚 Creating transfers for 2025...")
  const transfers = []

  for (let month = 1; month <= 12; month++) {
    const transfersPerMonth = getRandomQuantity(8, 15)

    for (let transferIndex = 0; transferIndex < transfersPerMonth; transferIndex++) {
      const fromWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)]
      let toWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)]

      // Ensure different warehouses
      while (toWarehouse.id === fromWarehouse.id) {
        toWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)]
      }

      const randomUser = users[Math.floor(Math.random() * users.length)]

      const transfer = await prisma.transfer.create({
        data: {
          transferNumber: `TRF-2025-${String(month).padStart(2, "0")}-${String(transferIndex + 1).padStart(3, "0")}`,
          fromWarehouseId: fromWarehouse.id,
          toWarehouseId: toWarehouse.id,
          createdById: randomUser.id,
          notes: `Inter-warehouse transfer - ${month}/${2025}`,
          transferDate: getRandomDateIn2025(month, month),
        },
      })

      // Add 1-5 items to each transfer
      const itemsInTransfer = getRandomQuantity(1, 5)
      for (let itemIndex = 0; itemIndex < itemsInTransfer; itemIndex++) {
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const quantity = getRandomQuantity(5, 100)

        await prisma.transferItem.create({
          data: {
            transferId: transfer.id,
            itemId: randomItem.id,
            quantity: quantity,
          },
        })
      }
    }
  }

  // Generate withdrawals throughout 2025
  console.log("📤 Creating withdrawals for 2025...")

  for (let month = 1; month <= 12; month++) {
    const withdrawalsPerMonth = getRandomQuantity(10, 20)

    for (let withdrawalIndex = 0; withdrawalIndex < withdrawalsPerMonth; withdrawalIndex++) {
      const randomWarehouse = warehouses[Math.floor(Math.random() * warehouses.length)]
      const randomUser = users[Math.floor(Math.random() * users.length)]

      const purposes = [
        "Office consumption",
        "Production use",
        "Maintenance",
        "Customer order",
        "Internal project",
        "Quality testing",
        "Emergency use",
        "Promotional samples",
      ]

      const withdrawal = await prisma.withdrawal.create({
        data: {
          withdrawalNumber: `WDL-2025-${String(month).padStart(2, "0")}-${String(withdrawalIndex + 1).padStart(3, "0")}`,
          warehouseId: randomWarehouse.id,
          createdById: randomUser.id,
          purpose: purposes[Math.floor(Math.random() * purposes.length)],
          withdrawalDate: getRandomDateIn2025(month, month),
        },
      })

      // Add 1-3 items to each withdrawal
      const itemsInWithdrawal = getRandomQuantity(1, 3)
      for (let itemIndex = 0; itemIndex < itemsInWithdrawal; itemIndex++) {
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const quantity = getRandomQuantity(1, 50)
        const unitCost = getRandomCostVariation(Number(randomItem.standardCost), 0.1)

        await prisma.withdrawalItem.create({
          data: {
            withdrawalId: withdrawal.id,
            itemId: randomItem.id,
            quantity: quantity,
            unitCost: unitCost,
            totalValue: quantity * unitCost,
          },
        })
      }
    }
  }

  // Generate current inventory records
  console.log("📊 Creating current inventory records...")
  const inventoryRecords = []

  // Create inventory records for random item-warehouse combinations
  for (const warehouse of warehouses) {
    // Each warehouse will have 60-80% of all items
    const itemsInWarehouse = Math.floor(items.length * (0.6 + Math.random() * 0.2))
    const shuffledItems = [...items].sort(() => Math.random() - 0.5)

    for (let i = 0; i < itemsInWarehouse; i++) {
      const item = shuffledItems[i]
      const quantity = getRandomQuantity(10, 1000)
      const avgUnitCost = getRandomCostVariation(Number(item.standardCost), 0.05)

      inventoryRecords.push({
        itemId: item.id,
        warehouseId: warehouse.id,
        quantity: quantity,
        totalValue: quantity * avgUnitCost,
        avgUnitCost: avgUnitCost,
      })
    }
  }

  await Promise.all(inventoryRecords.map((record) => prisma.currentInventory.create({ data: record })))

  // Create sample notifications
  console.log("🔔 Creating sample notifications...")
  const notificationTypes = ["INFO", "SUCCESS", "WARNING", "ERROR"] as const
  const notificationTitles = [
    "Low Stock Alert",
    "Reorder Point Reached",
    "Transfer Completed",
    "Withdrawal Processed",
    "Inventory Adjustment",
    "System Maintenance",
    "New Item Added",
    "Supplier Update",
  ]

  for (let i = 0; i < 50; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)]
    const randomItem = items[Math.floor(Math.random() * items.length)]
    const randomType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)]
    const randomTitle = notificationTitles[Math.floor(Math.random() * notificationTitles.length)]

    await prisma.notification.create({
      data: {
        title: randomTitle,
        message: `${randomTitle} for ${randomItem.description} (${randomItem.itemCode})`,
        type: randomType,
        userId: randomUser.id,
        referenceType: "ITEM",
        referenceId: randomItem.id,
        isRead: Math.random() > 0.3, // 70% chance of being read
        createdAt: getRandomDateIn2025(1, 12),
      },
    })
  }

  console.log("✅ Comprehensive seed completed successfully!")
  console.log("\n📊 Summary:")
  console.log(`- Created ${warehouses.length} warehouses`)
  console.log(`- Created ${suppliers.length} suppliers`)
  console.log(`- Created ${users.length} users`)
  console.log(`- Created ${items.length} items`)
  console.log(`- Created ${itemEntries.length} item entries throughout 2025`)
  console.log(`- Created comprehensive transfers and withdrawals`)
  console.log(`- Created ${inventoryRecords.length} current inventory records`)
  console.log(`- Created 50 sample notifications`)

  console.log("\n🔑 Login Credentials:")
  console.log("Username: admin")
  console.log("Password: asdasd123")
  console.log("\nOther users (password: password123):")
  userData.slice(1).forEach((user) => {
    console.log(`- ${user.username} (${user.position})`)
  })

  console.log("\n💰 Cost Accounting:")
  console.log("- Default costing method: WEIGHTED_AVERAGE")
  console.log("- Items with varied costing methods for testing")
  console.log("- Comprehensive cost tracking throughout 2025")
  console.log("- Realistic price variations and market fluctuations")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Comprehensive seeding failed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
