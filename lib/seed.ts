import { PrismaClient, UserRole, Permission, PurchaseStatus, TransferStatus, WithdrawalStatus, MovementType, CostingMethodType, CostLayerType, AdjustmentType, AuditAction, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Clear existing data in correct order (respecting foreign key constraints)
  await prisma.auditLog.deleteMany();
  await prisma.costVariance.deleteMany();
  await prisma.inventoryAdjustmentItem.deleteMany();
  await prisma.inventoryAdjustment.deleteMany();
  await prisma.costAllocation.deleteMany();
  await prisma.costLayer.deleteMany();
  await prisma.currentInventory.deleteMany();
  await prisma.monthlyWeightedAverage.deleteMany();
  await prisma.costingMethod.deleteMany();
  await prisma.withdrawalItem.deleteMany();
  await prisma.withdrawal.deleteMany();
  await prisma.transferItem.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.item.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.userPermission.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log('Existing data cleared...');

  // Create Users with different roles
  const hashedPassword = await bcrypt.hash('password123', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@company.com',
      username: 'superadmin',
      passwordHash: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      employeeId: 'EMP001',
      department: 'IT',
      position: 'System Administrator',
      phone: '+1234567890',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      username: 'admin',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      employeeId: 'EMP002',
      department: 'Management',
      position: 'Administrator',
      phone: '+1234567891',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  const warehouseManager = await prisma.user.create({
    data: {
      email: 'warehouse.manager@company.com',
      username: 'warehouse_manager',
      passwordHash: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      employeeId: 'EMP003',
      department: 'Warehouse',
      position: 'Warehouse Manager',
      phone: '+1234567892',
      role: UserRole.WAREHOUSE_MANAGER,
      isActive: true,
    },
  });

  const inventoryClerk = await prisma.user.create({
    data: {
      email: 'inventory.clerk@company.com',
      username: 'inventory_clerk',
      passwordHash: hashedPassword,
      firstName: 'Mike',
      lastName: 'Smith',
      employeeId: 'EMP004',
      department: 'Warehouse',
      position: 'Inventory Clerk',
      phone: '+1234567893',
      role: UserRole.INVENTORY_CLERK,
      isActive: true,
    },
  });

  const purchaser = await prisma.user.create({
    data: {
      email: 'purchaser@company.com',
      username: 'purchaser',
      passwordHash: hashedPassword,
      firstName: 'Anna',
      lastName: 'Williams',
      employeeId: 'EMP005',
      department: 'Procurement',
      position: 'Purchasing Agent',
      phone: '+1234567894',
      role: UserRole.PURCHASER,
      isActive: true,
    },
  });

  const approver = await prisma.user.create({
    data: {
      email: 'approver@company.com',
      username: 'approver',
      passwordHash: hashedPassword,
      firstName: 'Robert',
      lastName: 'Brown',
      employeeId: 'EMP006',
      department: 'Management',
      position: 'Operations Manager',
      phone: '+1234567895',
      role: UserRole.APPROVER,
      isActive: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: 'user@company.com',
      username: 'regular_user',
      passwordHash: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      employeeId: 'EMP007',
      department: 'Operations',
      position: 'Staff',
      phone: '+1234567896',
      role: UserRole.USER,
      isActive: true,
    },
  });

  console.log('Users created...');

  // Create User Permissions
  const adminPermissions: Permission[] = [
    Permission.CREATE_ITEMS,
    Permission.UPDATE_ITEMS,
    Permission.DELETE_ITEMS,
    Permission.VIEW_ITEMS,
    Permission.CREATE_PURCHASES,
    Permission.VIEW_PURCHASES,
    Permission.CREATE_TRANSFERS,
    Permission.VIEW_TRANSFERS,
    Permission.REQUEST_WITHDRAWALS,
    Permission.VIEW_WITHDRAWALS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_REPORTS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_WAREHOUSES,
    Permission.MANAGE_SUPPLIERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.SYSTEM_SETTINGS,
  ];

  const warehouseManagerPermissions: Permission[] = [
    Permission.VIEW_ITEMS,
    Permission.UPDATE_ITEMS,
    Permission.CREATE_TRANSFERS,
    Permission.APPROVE_TRANSFERS,
    Permission.VIEW_TRANSFERS,
    Permission.REQUEST_WITHDRAWALS,
    Permission.APPROVE_WITHDRAWALS,
    Permission.VIEW_WITHDRAWALS,
    Permission.ADJUST_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.RECOUNT_INVENTORY,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_REPORTS,
  ];

  const inventoryClerkPermissions: Permission[] = [
    Permission.VIEW_ITEMS,
    Permission.CREATE_TRANSFERS,
    Permission.VIEW_TRANSFERS,
    Permission.REQUEST_WITHDRAWALS,
    Permission.VIEW_WITHDRAWALS,
    Permission.ADJUST_INVENTORY,
    Permission.VIEW_INVENTORY,
    Permission.RECOUNT_INVENTORY,
  ];

  const purchaserPermissions: Permission[] = [
    Permission.VIEW_ITEMS,
    Permission.CREATE_PURCHASES,
    Permission.VIEW_PURCHASES,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_REPORTS,
  ];

  const approverPermissions: Permission[] = [
    Permission.VIEW_ITEMS,
    Permission.APPROVE_PURCHASES,
    Permission.VIEW_PURCHASES,
    Permission.APPROVE_TRANSFERS,
    Permission.VIEW_TRANSFERS,
    Permission.APPROVE_WITHDRAWALS,
    Permission.VIEW_WITHDRAWALS,
    Permission.VIEW_INVENTORY,
    Permission.VIEW_REPORTS,
  ];

  const userPermissions: Permission[] = [
    Permission.VIEW_ITEMS,
    Permission.VIEW_INVENTORY,
    Permission.REQUEST_WITHDRAWALS,
    Permission.VIEW_WITHDRAWALS,
  ];

  // Create permissions for each user
  const allUserPermissions = [
    { user: admin, permissions: adminPermissions },
    { user: warehouseManager, permissions: warehouseManagerPermissions },
    { user: inventoryClerk, permissions: inventoryClerkPermissions },
    { user: purchaser, permissions: purchaserPermissions },
    { user: approver, permissions: approverPermissions },
    { user: regularUser, permissions: userPermissions },
  ];

  for (const { user, permissions } of allUserPermissions) {
    for (const permission of permissions) {
      await prisma.userPermission.create({
        data: {
          userId: user.id,
          permission,
          grantedBy: superAdmin.id,
          grantedAt: new Date(),
        },
      });
    }
  }

  console.log('User permissions created...');

  // Create Warehouses
  const mainWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Main Warehouse',
      location: '123 Industrial Ave, City, State 12345',
      description: 'Primary warehouse facility',
      isMainWarehouse: true,
      defaultCostingMethod: CostingMethodType.WEIGHTED_AVERAGE,
    },
  });

  const secondaryWarehouse = await prisma.warehouse.create({
    data: {
      name: 'Secondary Warehouse',
      location: '456 Storage St, City, State 12346',
      description: 'Secondary storage facility',
      isMainWarehouse: false,
      defaultCostingMethod: CostingMethodType.FIFO,
    },
  });

  const distributionCenter = await prisma.warehouse.create({
    data: {
      name: 'Distribution Center',
      location: '789 Distribution Blvd, City, State 12347',
      description: 'Distribution and shipping center',
      isMainWarehouse: false,
      defaultCostingMethod: CostingMethodType.WEIGHTED_AVERAGE,
    },
  });

  console.log('Warehouses created...');

  // Create Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'ABC Manufacturing Co.',
      contactInfo: 'contact@abcmfg.com | +1-555-0101',
      purchaseReference: 'ABC-REF-001',
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'XYZ Electronics Ltd.',
      contactInfo: 'sales@xyzelec.com | +1-555-0102',
      purchaseReference: 'XYZ-REF-002',
    },
  });

  const supplier3 = await prisma.supplier.create({
    data: {
      name: 'Global Parts Supply',
      contactInfo: 'orders@globalparts.com | +1-555-0103',
      purchaseReference: 'GPS-REF-003',
    },
  });

  console.log('Suppliers created...');

  // Create Items
  const items = await Promise.all([
    prisma.item.create({
      data: {
        itemCode: 'ITEM-001',
        description: 'Industrial Grade Steel Bolts - M8x50mm',
        unitOfMeasure: 'pieces',
        standardCost: 2.50,
        costingMethod: CostingMethodType.WEIGHTED_AVERAGE,
        reorderLevel: 100,
        maxLevel: 1000,
        minLevel: 50,
        supplierId: supplier1.id,
      },
    }),
    prisma.item.create({
      data: {
        itemCode: 'ITEM-002',
        description: 'Electronic Circuit Board PCB-500',
        unitOfMeasure: 'pieces',
        standardCost: 45.75,
        costingMethod: CostingMethodType.FIFO,
        reorderLevel: 25,
        maxLevel: 200,
        minLevel: 10,
        supplierId: supplier2.id,
      },
    }),
    prisma.item.create({
      data: {
        itemCode: 'ITEM-003',
        description: 'Heavy Duty Motor Oil - 5W30 (1L)',
        unitOfMeasure: 'liters',
        standardCost: 8.99,
        costingMethod: CostingMethodType.WEIGHTED_AVERAGE,
        reorderLevel: 50,
        maxLevel: 500,
        minLevel: 20,
        supplierId: supplier3.id,
      },
    }),
    prisma.item.create({
      data: {
        itemCode: 'ITEM-004',
        description: 'Precision Bearing - Type 6205',
        unitOfMeasure: 'pieces',
        standardCost: 15.25,
        costingMethod: CostingMethodType.SPECIFIC_IDENTIFICATION,
        reorderLevel: 30,
        maxLevel: 300,
        minLevel: 15,
        supplierId: supplier1.id,
      },
    }),
    prisma.item.create({
      data: {
        itemCode: 'ITEM-005',
        description: 'LED Display Module - 7-Segment',
        unitOfMeasure: 'pieces',
        standardCost: 12.50,
        costingMethod: CostingMethodType.FIFO,
        reorderLevel: 40,
        maxLevel: 400,
        minLevel: 20,
        supplierId: supplier2.id,
      },
    }),
  ]);

  console.log('Items created...');

  // Create Purchases
  const purchase1 = await prisma.purchase.create({
    data: {
      purchaseOrder: 'PO-2024-001',
      purchaseDate: new Date('2024-01-15'),
      totalCost: 1875.00,
      status: PurchaseStatus.RECEIVED,
      supplierId: supplier1.id,
      createdById: purchaser.id,
      approvedById: approver.id,
      approvedAt: new Date('2024-01-16'),
      purchaseItems: {
        create: [
          {
            itemId: items[0].id, // Steel Bolts
            quantity: 500,
            unitCost: 2.50,
            totalCost: 1250.00,
          },
          {
            itemId: items[3].id, // Precision Bearing
            quantity: 41,
            unitCost: 15.25,
            totalCost: 625.25,
          },
        ],
      },
    },
  });

  const purchase2 = await prisma.purchase.create({
    data: {
      purchaseOrder: 'PO-2024-002',
      purchaseDate: new Date('2024-01-20'),
      totalCost: 2287.50,
      status: PurchaseStatus.RECEIVED,
      supplierId: supplier2.id,
      createdById: purchaser.id,
      approvedById: approver.id,
      approvedAt: new Date('2024-01-21'),
      purchaseItems: {
        create: [
          {
            itemId: items[1].id, // Circuit Board
            quantity: 50,
            unitCost: 45.75,
            totalCost: 2287.50,
          },
        ],
      },
    },
  });

  const purchase3 = await prisma.purchase.create({
    data: {
      purchaseOrder: 'PO-2024-003',
      purchaseDate: new Date('2024-01-25'),
      totalCost: 1348.00,
      status: PurchaseStatus.RECEIVED,
      supplierId: supplier3.id,
      createdById: purchaser.id,
      approvedById: approver.id,
      approvedAt: new Date('2024-01-26'),
      purchaseItems: {
        create: [
          {
            itemId: items[2].id, // Motor Oil
            quantity: 150,
            unitCost: 8.99,
            totalCost: 1348.50,
          },
        ],
      },
    },
  });

  console.log('Purchases created...');

  // Create Initial Inventory Movements (Purchase Receipts)
  const inventoryMovements = [];

  // Steel Bolts - Purchase Receipt
  inventoryMovements.push(
    await prisma.inventoryMovement.create({
      data: {
        movementType: MovementType.PURCHASE_RECEIPT,
        quantity: 500,
        unitCost: 2.50,
        totalValue: 1250.00,
        referenceId: purchase1.id,
        notes: 'Initial purchase receipt',
        itemId: items[0].id,
        warehouseId: mainWarehouse.id,
        balanceQuantity: 500,
        balanceValue: 1250.00,
        costMethod: CostingMethodType.WEIGHTED_AVERAGE,
      },
    })
  );

  // Precision Bearing - Purchase Receipt
  inventoryMovements.push(
    await prisma.inventoryMovement.create({
      data: {
        movementType: MovementType.PURCHASE_RECEIPT,
        quantity: 41,
        unitCost: 15.25,
        totalValue: 625.25,
        referenceId: purchase1.id,
        notes: 'Initial purchase receipt',
        itemId: items[3].id,
        warehouseId: mainWarehouse.id,
        balanceQuantity: 41,
        balanceValue: 625.25,
        costMethod: CostingMethodType.SPECIFIC_IDENTIFICATION,
      },
    })
  );

  // Circuit Board - Purchase Receipt
  inventoryMovements.push(
    await prisma.inventoryMovement.create({
      data: {
        movementType: MovementType.PURCHASE_RECEIPT,
        quantity: 50,
        unitCost: 45.75,
        totalValue: 2287.50,
        referenceId: purchase2.id,
        notes: 'Initial purchase receipt',
        itemId: items[1].id,
        warehouseId: mainWarehouse.id,
        balanceQuantity: 50,
        balanceValue: 2287.50,
        costMethod: CostingMethodType.FIFO,
      },
    })
  );

  // Motor Oil - Purchase Receipt
  inventoryMovements.push(
    await prisma.inventoryMovement.create({
      data: {
        movementType: MovementType.PURCHASE_RECEIPT,
        quantity: 150,
        unitCost: 8.99,
        totalValue: 1348.50,
        referenceId: purchase3.id,
        notes: 'Initial purchase receipt',
        itemId: items[2].id,
        warehouseId: mainWarehouse.id,
        balanceQuantity: 150,
        balanceValue: 1348.50,
        costMethod: CostingMethodType.WEIGHTED_AVERAGE,
      },
    })
  );

  console.log('Inventory movements created...');

  // Create Current Inventory records
  await prisma.currentInventory.createMany({
    data: [
      {
        itemId: items[0].id,
        warehouseId: mainWarehouse.id,
        quantity: 500,
        totalValue: 1250.00,
        avgUnitCost: 2.50,
      },
      {
        itemId: items[1].id,
        warehouseId: mainWarehouse.id,
        quantity: 50,
        totalValue: 2287.50,
        avgUnitCost: 45.75,
      },
      {
        itemId: items[2].id,
        warehouseId: mainWarehouse.id,
        quantity: 150,
        totalValue: 1348.50,
        avgUnitCost: 8.99,
      },
      {
        itemId: items[3].id,
        warehouseId: mainWarehouse.id,
        quantity: 41,
        totalValue: 625.25,
        avgUnitCost: 15.25,
      },
    ],
  });

  console.log('Current inventory created...');

  // Create Cost Layers for FIFO/LIFO tracking
  const costLayers = [
    {
      itemId: items[0].id,
      warehouseId: mainWarehouse.id,
      quantity: 500,
      remainingQty: 500,
      unitCost: 2.50,
      totalCost: 1250.00,
      layerDate: new Date('2024-01-16'),
      layerType: CostLayerType.PURCHASE,
      sourceRef: purchase1.id,
    },
    {
      itemId: items[1].id,
      warehouseId: mainWarehouse.id,
      quantity: 50,
      remainingQty: 50,
      unitCost: 45.75,
      totalCost: 2287.50,
      layerDate: new Date('2024-01-21'),
      layerType: CostLayerType.PURCHASE,
      sourceRef: purchase2.id,
    },
    {
      itemId: items[2].id,
      warehouseId: mainWarehouse.id,
      quantity: 150,
      remainingQty: 150,
      unitCost: 8.99,
      totalCost: 1348.50,
      layerDate: new Date('2024-01-26'),
      layerType: CostLayerType.PURCHASE,
      sourceRef: purchase3.id,
    },
    {
      itemId: items[3].id,
      warehouseId: mainWarehouse.id,
      quantity: 41,
      remainingQty: 41,
      unitCost: 15.25,
      totalCost: 625.25,
      layerDate: new Date('2024-01-16'),
      layerType: CostLayerType.PURCHASE,
      sourceRef: purchase1.id,
    },
  ];

  await prisma.costLayer.createMany({ data: costLayers });

  console.log('Cost layers created...');

  // Create a sample Transfer
  const transfer1 = await prisma.transfer.create({
    data: {
      transferNumber: 'TRF-2024-001',
      transferDate: new Date('2024-02-01'),
      status: TransferStatus.COMPLETED,
      notes: 'Transfer to secondary warehouse for distribution',
      fromWarehouseId: mainWarehouse.id,
      toWarehouseId: secondaryWarehouse.id,
      createdById: inventoryClerk.id,
      approvedById: warehouseManager.id,
      approvedAt: new Date('2024-02-01'),
      transferItems: {
        create: [
          {
            itemId: items[0].id, // Steel Bolts
            quantity: 100,
          },
          {
            itemId: items[1].id, // Circuit Board
            quantity: 10,
          },
        ],
      },
    },
  });

  console.log('Transfer created...');

  // Create a sample Withdrawal
  const withdrawal1 = await prisma.withdrawal.create({
    data: {
      withdrawalNumber: 'WTH-2024-001',
      withdrawalDate: new Date('2024-02-05'),
      purpose: 'Production line assembly',
      status: WithdrawalStatus.COMPLETED,
      warehouseId: mainWarehouse.id,
      requestedById: regularUser.id,
      approvedById: warehouseManager.id,
      approvedAt: new Date('2024-02-05'),
      withdrawalItems: {
        create: [
          {
            itemId: items[0].id, // Steel Bolts
            quantity: 50,
            unitCost: 2.50,
            totalValue: 125.00,
          },
          {
            itemId: items[3].id, // Precision Bearing
            quantity: 5,
            unitCost: 15.25,
            totalValue: 76.25,
          },
        ],
      },
    },
  });

  console.log('Withdrawal created...');

  // Create an Inventory Adjustment
  const adjustment1 = await prisma.inventoryAdjustment.create({
    data: {
      adjustmentNumber: 'ADJ-2024-001',
      adjustmentType: AdjustmentType.PHYSICAL_COUNT,
      reason: 'Monthly physical count discrepancy',
      notes: 'Found 5 extra units during count',
      warehouseId: mainWarehouse.id,
      adjustedById: inventoryClerk.id,
      adjustedAt: new Date('2024-02-10'),
      adjustmentItems: {
        create: [
          {
            itemId: items[2].id, // Motor Oil
            systemQuantity: 150,
            actualQuantity: 155,
            adjustmentQuantity: 5,
            unitCost: 8.99,
            totalAdjustment: 44.95,
          },
        ],
      },
    },
  });

  console.log('Inventory adjustment created...');

  // Create Audit Logs
  const auditLogs: Prisma.AuditLogCreateManyInput[] = [
    {
      tableName: 'purchases',
      recordId: purchase1.id,
      action: AuditAction.CREATE,
      oldValues: Prisma.DbNull,
      newValues: { purchaseOrder: 'PO-2024-001', status: 'PENDING' },
      changedFields: ['purchaseOrder', 'status'],
      userId: purchaser.id,
      userEmail: purchaser.email,
      transactionType: 'PURCHASE',
      referenceNumber: 'PO-2024-001',
      notes: 'Purchase order created',
      timestamp: new Date('2024-01-15T10:00:00Z'),
    },
    {
      tableName: 'purchases',
      recordId: purchase1.id,
      action: AuditAction.APPROVE,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'RECEIVED', approvedBy: approver.id },
      changedFields: ['status', 'approvedBy'],
      userId: approver.id,
      userEmail: approver.email,
      transactionType: 'PURCHASE',
      referenceNumber: 'PO-2024-001',
      notes: 'Purchase order approved and received',
      timestamp: new Date('2024-01-16T14:30:00Z'),
    },
    {
      tableName: 'transfers',
      recordId: transfer1.id,
      action: AuditAction.CREATE,
      oldValues: Prisma.DbNull,
      newValues: { transferNumber: 'TRF-2024-001', status: 'PENDING' },
      changedFields: ['transferNumber', 'status'],
      userId: inventoryClerk.id,
      userEmail: inventoryClerk.email,
      transactionType: 'TRANSFER',
      referenceNumber: 'TRF-2024-001',
      notes: 'Transfer created',
      timestamp: new Date('2024-02-01T09:15:00Z'),
    },
    {
      tableName: 'withdrawals',
      recordId: withdrawal1.id,
      action: AuditAction.CREATE,
      oldValues: Prisma.DbNull,
      newValues: { withdrawalNumber: 'WTH-2024-001', status: 'PENDING' },
      changedFields: ['withdrawalNumber', 'status'],
      userId: regularUser.id,
      userEmail: regularUser.email,
      transactionType: 'WITHDRAWAL',
      referenceNumber: 'WTH-2024-001',
      notes: 'Withdrawal request created',
      timestamp: new Date('2024-02-05T11:20:00Z'),
    },
  ];

  await prisma.auditLog.createMany({ data: auditLogs });

  console.log('Audit logs created...');

  // Create Monthly Weighted Averages
  const monthlyAverages = [
    {
      itemId: items[0].id,
      warehouseId: mainWarehouse.id,
      year: 2024,
      month: 1,
      weightedAvgCost: 2.50,
      totalQuantity: 500,
      totalValue: 1250.00,
      openingQuantity: 0,
      openingValue: 0,
      closingQuantity: 500,
      closingValue: 1250.00,
      purchaseQuantity: 500,
      purchaseValue: 1250.00,
    },
    {
      itemId: items[1].id,
      warehouseId: mainWarehouse.id,
      year: 2024,
      month: 1,
      weightedAvgCost: 45.75,
      totalQuantity: 50,
      totalValue: 2287.50,
      openingQuantity: 0,
      openingValue: 0,
      closingQuantity: 50,
      closingValue: 2287.50,
      purchaseQuantity: 50,
      purchaseValue: 2287.50,
    },
  ];

  await prisma.monthlyWeightedAverage.createMany({ data: monthlyAverages });

  console.log('Monthly weighted averages created...');

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });