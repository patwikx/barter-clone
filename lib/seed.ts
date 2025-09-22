import { PrismaClient, Permission } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed process...')

  // Create Warehouses first
  console.log('📦 Creating warehouses...')
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        name: 'Manila Main Warehouse',
        location: 'Quezon City, Metro Manila',
        description: 'Primary distribution center for NCR',
        isMainWarehouse: true,
        defaultCostingMethod: 'WEIGHTED_AVERAGE'
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Cebu Distribution Center',
        location: 'Lapu-Lapu City, Cebu',
        description: 'Regional hub for Visayas operations',
        isMainWarehouse: false,
        defaultCostingMethod: 'WEIGHTED_AVERAGE'
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Davao Regional Warehouse',
        location: 'Davao City, Davao del Sur',
        description: 'Main distribution point for Mindanao',
        isMainWarehouse: false,
        defaultCostingMethod: 'FIFO'
      }
    }),
    prisma.warehouse.create({
      data: {
        name: 'Baguio Cold Storage',
        location: 'Baguio City, Benguet',
        description: 'Specialized cold storage facility',
        isMainWarehouse: false,
        defaultCostingMethod: 'WEIGHTED_AVERAGE'
      }
    })
  ])

  // Create Suppliers
  console.log('🏢 Creating suppliers...')
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Manila Trading Corp',
        contactInfo: 'contact@manilatrading.ph | +63-2-8123-4567',
        purchaseReference: 'MTC'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Cebu Pacific Supplies',
        contactInfo: 'info@cebupacific.supplies | +63-32-456-7890',
        purchaseReference: 'CPS'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Davao Agricultural Products',
        contactInfo: 'sales@davaoagri.ph | +63-82-234-5678',
        purchaseReference: 'DAP'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'SM Business Solutions',
        contactInfo: 'procurement@smbusiness.ph | +63-2-8789-0123',
        purchaseReference: 'SMBS'
      }
    }),
    prisma.supplier.create({
      data: {
        name: 'Robinsons Industrial Supply',
        contactInfo: 'orders@robinsons-industrial.ph | +63-2-8456-7890',
        purchaseReference: 'RIS'
      }
    })
  ])

  // Create Admin User
  console.log('👤 Creating admin user...')
  const adminPasswordHash = await bcrypt.hash('asdasd123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@inventory.ph',
      passwordHash: adminPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'System Administrator',
      phone: '+63-2-8123-4567',
      role: 'SUPER_ADMIN',
      defaultWarehouseId: warehouses[0].id,
      isActive: true,
      lastLoginAt: new Date()
    }
  })

  // Create additional users
  console.log('👥 Creating additional users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'juan.dela.cruz',
        email: 'juan@inventory.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        employeeId: 'EMP002',
        department: 'Warehouse',
        position: 'Warehouse Manager',
        phone: '+63-917-123-4567',
        role: 'WAREHOUSE_MANAGER',
        defaultWarehouseId: warehouses[0].id
      }
    }),
    prisma.user.create({
      data: {
        username: 'maria.santos',
        email: 'maria@inventory.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Maria',
        lastName: 'Santos',
        employeeId: 'EMP003',
        department: 'Inventory',
        position: 'Inventory Clerk',
        phone: '+63-918-234-5678',
        role: 'INVENTORY_CLERK',
        defaultWarehouseId: warehouses[1].id
      }
    }),
    prisma.user.create({
      data: {
        username: 'jose.rizal',
        email: 'jose@inventory.ph',
        passwordHash: await bcrypt.hash('password123', 10),
        firstName: 'Jose',
        lastName: 'Rizal',
        employeeId: 'EMP004',
        department: 'Purchasing',
        position: 'Purchase Officer',
        phone: '+63-919-345-6789',
        role: 'PURCHASER',
        defaultWarehouseId: warehouses[2].id
      }
    })
  ])

  // Assign user permissions
  console.log('🔐 Assigning user permissions...')
  const allUsers = [adminUser, ...users]
  
  // Admin gets all permissions
  const allPermissions: Permission[] = [
    'CREATE_ITEMS', 'UPDATE_ITEMS', 'DELETE_ITEMS', 'VIEW_ITEMS',
    'CREATE_ITEM_ENTRIES', 'VIEW_ITEM_ENTRIES',
    'CREATE_TRANSFERS', 'VIEW_TRANSFERS', 'CANCEL_TRANSFERS',
    'CREATE_WITHDRAWALS', 'VIEW_WITHDRAWALS', 'CANCEL_WITHDRAWALS',
    'ADJUST_INVENTORY', 'VIEW_INVENTORY', 'RECOUNT_INVENTORY',
    'VIEW_REPORTS', 'EXPORT_REPORTS', 'VIEW_COST_REPORTS',
    'MANAGE_USERS', 'MANAGE_WAREHOUSES', 'MANAGE_SUPPLIERS', 'VIEW_AUDIT_LOGS', 'SYSTEM_SETTINGS'
  ]

  for (const permission of allPermissions) {
    await prisma.userPermission.create({
      data: {
        userId: adminUser.id,
        permission: permission,
        grantedBy: 'SYSTEM'
      }
    })
  }

  // Warehouse manager permissions
  const warehouseManagerPermissions: Permission[] = [
    'VIEW_ITEMS', 'CREATE_ITEM_ENTRIES', 'VIEW_ITEM_ENTRIES',
    'CREATE_TRANSFERS', 'VIEW_TRANSFERS', 'CANCEL_TRANSFERS',
    'CREATE_WITHDRAWALS', 'VIEW_WITHDRAWALS', 'CANCEL_WITHDRAWALS',
    'ADJUST_INVENTORY', 'VIEW_INVENTORY', 'RECOUNT_INVENTORY',
    'VIEW_REPORTS', 'EXPORT_REPORTS'
  ]

  for (const permission of warehouseManagerPermissions) {
    await prisma.userPermission.create({
      data: {
        userId: users[0].id,
        permission: permission,
        grantedBy: adminUser.id
      }
    })
  }

  // Create user-warehouse assignments
  console.log('🏭 Creating user-warehouse assignments...')
  await Promise.all([
    prisma.userWarehouse.create({
      data: {
        userId: adminUser.id,
        warehouseId: warehouses[0].id,
        role: 'MANAGER'
      }
    }),
    prisma.userWarehouse.create({
      data: {
        userId: users[0].id,
        warehouseId: warehouses[0].id,
        role: 'MANAGER'
      }
    }),
    prisma.userWarehouse.create({
      data: {
        userId: users[1].id,
        warehouseId: warehouses[1].id,
        role: 'CLERK'
      }
    }),
    prisma.userWarehouse.create({
      data: {
        userId: users[2].id,
        warehouseId: warehouses[2].id,
        role: 'SUPERVISOR'
      }
    })
  ])

  // Create Items
  console.log('📋 Creating items...')
  const items = await Promise.all([
    // Office Supplies
    prisma.item.create({
      data: {
        itemCode: 'OFF-001',
        description: 'A4 Bond Paper - 70gsm',
        unitOfMeasure: 'REAM',
        standardCost: 250.00,
        costingMethod: 'WEIGHTED_AVERAGE',
        reorderLevel: 50,
        maxLevel: 500,
        minLevel: 25,
        supplierId: suppliers[3].id
      }
    }),
    prisma.item.create({
      data: {
        itemCode: 'OFF-002',
        description: 'Ballpoint Pen - Blue',
        unitOfMeasure: 'BOX',
        standardCost: 120.00,
        costingMethod: 'FIFO',
        reorderLevel: 20,
        maxLevel: 200,
        minLevel: 10,
        supplierId: suppliers[3].id
      }
    }),
    prisma.item.create({
      data: {
        itemCode: 'OFF-003',
        description: 'Manila Folder - Legal Size',
        unitOfMeasure: 'PACK',
        standardCost: 85.00,
        costingMethod: 'WEIGHTED_AVERAGE',
        reorderLevel: 30,
        maxLevel: 300,
        minLevel: 15,
        supplierId: suppliers[4].id
      }
    }),

    // Electronics
    prisma.item.create({
      data: {
        itemCode: 'ELE-001',
        description: 'USB Flash Drive - 32GB',
        unitOfMeasure: 'PIECE',
        standardCost: 450.00,
        costingMethod: 'SPECIFIC_IDENTIFICATION',
        reorderLevel: 25,
        maxLevel: 100,
        minLevel: 5,
        supplierId: suppliers[4].id
      }
    }),
    prisma.item.create({
      data: {
        itemCode: 'ELE-002',
        description: 'Ethernet Cable - Cat6 (10m)',
        unitOfMeasure: 'PIECE',
        standardCost: 180.00,
        costingMethod: 'WEIGHTED_AVERAGE',
        reorderLevel: 40,
        maxLevel: 200,
        minLevel: 10,
        supplierId: suppliers[1].id
      }
    }),

    // Food Items (for cold storage)
    prisma.item.create({
      data: {
        itemCode: 'FOD-001',
        description: 'Frozen Chicken Wings - 1kg',
        unitOfMeasure: 'KG',
        standardCost: 320.00,
        costingMethod: 'FIFO',
        reorderLevel: 100,
        maxLevel: 1000,
        minLevel: 50,
        supplierId: suppliers[2].id
      }
    }),
    prisma.item.create({
      data: {
        itemCode: 'FOD-002',
        description: 'Fresh Bangus - Whole',
        unitOfMeasure: 'KG',
        standardCost: 280.00,
        costingMethod: 'FIFO',
        reorderLevel: 75,
        maxLevel: 500,
        minLevel: 25,
        supplierId: suppliers[2].id
      }
    }),

    // Construction Materials
    prisma.item.create({
      data: {
        itemCode: 'CON-001',
        description: 'Portland Cement - 40kg bag',
        unitOfMeasure: 'BAG',
        standardCost: 245.00,
        costingMethod: 'WEIGHTED_AVERAGE',
        reorderLevel: 200,
        maxLevel: 2000,
        minLevel: 100,
        supplierId: suppliers[0].id
      }
    }),
    prisma.item.create({
      data: {
        itemCode: 'CON-002',
        description: 'Steel Rebar - 12mm x 6m',
        unitOfMeasure: 'PIECE',
        standardCost: 185.00,
        costingMethod: 'WEIGHTED_AVERAGE',
        reorderLevel: 150,
        maxLevel: 1000,
        minLevel: 50,
        supplierId: suppliers[0].id
      }
    }),

    // Cleaning Supplies
    prisma.item.create({
      data: {
        itemCode: 'CLN-001',
        description: 'Dishwashing Liquid - 1L',
        unitOfMeasure: 'BOTTLE',
        standardCost: 65.00,
        costingMethod: 'WEIGHTED_AVERAGE',
        reorderLevel: 100,
        maxLevel: 500,
        minLevel: 25,
        supplierId: suppliers[1].id
      }
    })
  ])

  // Create Initial Item Entries (Purchases)
  console.log('📦 Creating initial item entries...')
  const currentDate = new Date()
  const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)
  const fifteenDaysAgo = new Date(currentDate.getTime() - 15 * 24 * 60 * 60 * 1000)

  const itemEntries = [
    // Manila warehouse entries
    {
      itemId: items[0].id, warehouseId: warehouses[0].id, supplierId: suppliers[3].id,
      quantity: 200, landedCost: 245.00, purchaseReference: 'PO-2024-001',
      createdById: users[2].id, entryDate: thirtyDaysAgo
    },
    {
      itemId: items[1].id, warehouseId: warehouses[0].id, supplierId: suppliers[3].id,
      quantity: 50, landedCost: 118.00, purchaseReference: 'PO-2024-002',
      createdById: users[2].id, entryDate: thirtyDaysAgo
    },
    {
      itemId: items[3].id, warehouseId: warehouses[0].id, supplierId: suppliers[4].id,
      quantity: 75, landedCost: 435.00, purchaseReference: 'PO-2024-003',
      createdById: users[2].id, entryDate: fifteenDaysAgo
    },

    // Cebu warehouse entries
    {
      itemId: items[4].id, warehouseId: warehouses[1].id, supplierId: suppliers[1].id,
      quantity: 120, landedCost: 175.00, purchaseReference: 'PO-2024-004',
      createdById: users[1].id, entryDate: thirtyDaysAgo
    },
    {
      itemId: items[9].id, warehouseId: warehouses[1].id, supplierId: suppliers[1].id,
      quantity: 200, landedCost: 62.50, purchaseReference: 'PO-2024-005',
      createdById: users[1].id, entryDate: fifteenDaysAgo
    },

    // Davao warehouse entries
    {
      itemId: items[7].id, warehouseId: warehouses[2].id, supplierId: suppliers[0].id,
      quantity: 500, landedCost: 240.00, purchaseReference: 'PO-2024-006',
      createdById: adminUser.id, entryDate: thirtyDaysAgo
    },
    {
      itemId: items[8].id, warehouseId: warehouses[2].id, supplierId: suppliers[0].id,
      quantity: 300, landedCost: 182.00, purchaseReference: 'PO-2024-007',
      createdById: adminUser.id, entryDate: fifteenDaysAgo
    },

    // Baguio cold storage entries
    {
      itemId: items[5].id, warehouseId: warehouses[3].id, supplierId: suppliers[2].id,
      quantity: 250, landedCost: 315.00, purchaseReference: 'PO-2024-008',
      createdById: adminUser.id, entryDate: thirtyDaysAgo
    },
    {
      itemId: items[6].id, warehouseId: warehouses[3].id, supplierId: suppliers[2].id,
      quantity: 150, landedCost: 275.00, purchaseReference: 'PO-2024-009',
      createdById: adminUser.id, entryDate: fifteenDaysAgo
    }
  ]

  for (const entry of itemEntries) {
    await prisma.itemEntry.create({
      data: {
        ...entry,
        totalValue: entry.quantity * entry.landedCost,
        notes: `Initial stock purchase - ${entry.purchaseReference}`
      }
    })
  }

  // Create some transfers
  console.log('🚚 Creating sample transfers...')
  const transfer1 = await prisma.transfer.create({
    data: {
      transferNumber: 'TRF-2024-001',
      fromWarehouseId: warehouses[0].id,
      toWarehouseId: warehouses[1].id,
      createdById: users[0].id,
      notes: 'Regular stock replenishment',
      transferDate: fifteenDaysAgo
    }
  })

  await prisma.transferItem.create({
    data: {
      transferId: transfer1.id,
      itemId: items[0].id,
      quantity: 25
    }
  })

  // Create some withdrawals
  console.log('📤 Creating sample withdrawals...')
  const withdrawal1 = await prisma.withdrawal.create({
    data: {
      withdrawalNumber: 'WDL-2024-001',
      warehouseId: warehouses[0].id,
      createdById: users[1].id,
      purpose: 'Office consumption',
      withdrawalDate: fifteenDaysAgo
    }
  })

  await prisma.withdrawalItem.create({
    data: {
      withdrawalId: withdrawal1.id,
      itemId: items[1].id,
      quantity: 10,
      unitCost: 118.00,
      totalValue: 1180.00
    }
  })

  // Create current inventory records
  console.log('📊 Creating current inventory records...')
  const inventoryData = [
    { itemId: items[0].id, warehouseId: warehouses[0].id, quantity: 175, totalValue: 42875.00, avgUnitCost: 245.00 },
    { itemId: items[0].id, warehouseId: warehouses[1].id, quantity: 25, totalValue: 6125.00, avgUnitCost: 245.00 },
    { itemId: items[1].id, warehouseId: warehouses[0].id, quantity: 40, totalValue: 4720.00, avgUnitCost: 118.00 },
    { itemId: items[3].id, warehouseId: warehouses[0].id, quantity: 75, totalValue: 32625.00, avgUnitCost: 435.00 },
    { itemId: items[4].id, warehouseId: warehouses[1].id, quantity: 120, totalValue: 21000.00, avgUnitCost: 175.00 },
    { itemId: items[5].id, warehouseId: warehouses[3].id, quantity: 250, totalValue: 78750.00, avgUnitCost: 315.00 },
    { itemId: items[6].id, warehouseId: warehouses[3].id, quantity: 150, totalValue: 41250.00, avgUnitCost: 275.00 },
    { itemId: items[7].id, warehouseId: warehouses[2].id, quantity: 500, totalValue: 120000.00, avgUnitCost: 240.00 },
    { itemId: items[8].id, warehouseId: warehouses[2].id, quantity: 300, totalValue: 54600.00, avgUnitCost: 182.00 },
    { itemId: items[9].id, warehouseId: warehouses[1].id, quantity: 200, totalValue: 12500.00, avgUnitCost: 62.50 }
  ]

  for (const inv of inventoryData) {
    await prisma.currentInventory.create({
      data: inv
    })
  }

  // Create some notifications
  console.log('🔔 Creating sample notifications...')
  await Promise.all([
    prisma.notification.create({
      data: {
        title: 'Low Stock Alert',
        message: 'Ballpoint Pen - Blue (OFF-002) is running low in Manila warehouse',
        type: 'WARNING',
        userId: users[0].id,
        referenceType: 'ITEM',
        referenceId: items[1].id
      }
    }),
    prisma.notification.create({
      data: {
        title: 'Transfer Completed',
        message: 'Transfer TRF-2024-001 has been completed successfully',
        type: 'SUCCESS',
        userId: users[0].id,
        referenceType: 'TRANSFER',
        referenceId: transfer1.id
      }
    })
  ])

  console.log('✅ Seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Created ${warehouses.length} warehouses`)
  console.log(`- Created ${suppliers.length} suppliers`) 
  console.log(`- Created ${allUsers.length} users`)
  console.log(`- Created ${items.length} items`)
  console.log(`- Created ${itemEntries.length} item entries`)
  console.log(`- Created 1 transfer with items`)
  console.log(`- Created 1 withdrawal with items`)
  console.log(`- Created ${inventoryData.length} inventory records`)
  
  console.log('\n🔑 Login Credentials:')
  console.log('Username: admin')
  console.log('Password: asdasd123')
  console.log('\nOther users:')
  console.log('juan.dela.cruz / password123')
  console.log('maria.santos / password123')
  console.log('jose.rizal / password123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })