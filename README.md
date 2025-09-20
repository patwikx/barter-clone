# 🏭 Warehouse Management System (WMS)

A comprehensive, enterprise-grade warehouse management system built with modern web technologies. This system provides complete inventory control, cost accounting, and audit trails for multi-warehouse operations.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Development Plan](#development-plan)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Overview

This Warehouse Management System is designed for businesses that need to track inventory across multiple locations with sophisticated cost accounting and comprehensive audit trails. The system supports various costing methods (FIFO, LIFO, Weighted Average), real-time inventory updates, and role-based access control.

### Key Business Processes
- **Purchase Management**: Create, approve, and receive purchase orders
- **Inter-warehouse Transfers**: Move inventory between locations with approval workflows
- **Inventory Withdrawals**: Issue materials with proper authorization
- **Inventory Adjustments**: Handle physical count variances and corrections
- **Cost Accounting**: Advanced costing with multiple methods and variance analysis
- **Audit & Compliance**: Complete transaction trails and user activity logging

## ✨ Features

### 🔐 Authentication & Authorization
- NextAuth.js integration with multiple providers
- Role-based access control (Admin, Manager, Clerk, Purchaser, Approver, Viewer)
- Granular permissions system
- Session management and audit trails

### 📦 Inventory Management
- Multi-warehouse inventory tracking
- Real-time stock levels and movements
- Physical count and adjustment workflows
- Reorder level monitoring
- Batch and serial number support (planned)

### 🛒 Purchase Management
- Purchase order creation and approval workflows
- Supplier management
- Goods receipt processing
- Three-way matching (PO, Receipt, Invoice)

### 🔄 Transfer Management
- Inter-warehouse transfer requests
- Approval workflows based on user roles
- Real-time inventory updates across locations
- Transfer cost allocation

### 📤 Withdrawal Management
- Material requisition system
- Approval workflows
- Cost allocation using configurable methods
- Purpose and project tracking

### 💰 Cost Accounting
- Multiple costing methods (FIFO, LIFO, Weighted Average, Standard Cost)
- Cost layer management for precise cost tracking
- Monthly weighted average calculations
- Cost variance analysis
- Automated cost allocation on inventory movements

### 📊 Reporting & Analytics
- Real-time inventory reports
- Cost analysis and variance reports
- Movement history and audit trails
- Export capabilities (Excel, CSV, PDF)
- Dashboard with key metrics

### 🔍 Audit & Compliance
- Complete audit trail for all transactions
- User activity logging with IP and session tracking
- Change history with before/after values
- Regulatory compliance reporting

## 🛠 Tech Stack

### Frontend
- **Next.js 15.5.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/UI** - Modern, accessible UI components
- **Zustand** - Lightweight state management
- **Zod** - Schema validation and type inference

### Backend
- **Next.js Server Actions** - Server-side logic
- **Prisma** - Type-safe database ORM
- **NextAuth.js** - Authentication and authorization
- **PostgreSQL** - Primary database
- **Socket.IO** - Real-time updates and notifications

### DevOps & Deployment
- **Coolify** - Self-hosted deployment platform
- **Docker** - Containerization
- **PostgreSQL** - Production database

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript** - Static type checking

## 🗄 Database Schema

The system uses a comprehensive database schema with the following major entity groups:

### Core Entities
- **Users & Authentication**: User management with NextAuth.js integration
- **Master Data**: Suppliers, Items, Warehouses, Costing Methods
- **Transactions**: Purchases, Transfers, Withdrawals, Adjustments
- **Inventory Tracking**: Movement logs, current inventory, cost layers
- **Cost Accounting**: Cost calculations, variances, monthly averages
- **Audit System**: Complete transaction and user activity logs

![ERD Diagram](./docs/erd-diagram.png)

*See `prisma/schema.prisma` for the complete database schema.*

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/warehouse-management-system.git
   cd warehouse-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/warehouse_db"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # OAuth Providers (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Setup database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed # Optional: seed with sample data
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Development Plan

### Phase 1: Foundation (Weeks 1-2)
- [x] Database schema design and Prisma setup
- [ ] Authentication system with NextAuth.js
- [ ] Basic UI components with Shadcn/UI
- [ ] User management and role-based access
- [ ] Master data management (Suppliers, Items, Warehouses)

### Phase 2: Core Functionality (Weeks 3-4)
- [ ] Purchase order management
- [ ] Goods receipt processing
- [ ] Basic inventory tracking
- [ ] Transfer management between warehouses
- [ ] Withdrawal/issuance system

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Cost accounting implementation
- [ ] Inventory adjustments and physical counts
- [ ] Approval workflows and notifications
- [ ] Real-time updates with Socket.IO
- [ ] Dashboard and basic reporting

### Phase 4: Cost Accounting (Weeks 7-8)
- [ ] FIFO/LIFO cost layer implementation
- [ ] Weighted average calculations
- [ ] Cost variance analysis
- [ ] Monthly cost summaries
- [ ] Advanced cost reporting

### Phase 5: Reporting & Analytics (Weeks 9-10)
- [ ] Comprehensive reporting system
- [ ] Data export functionality
- [ ] Audit trail reports
- [ ] Performance analytics
- [ ] Mobile-responsive design

### Phase 6: Testing & Deployment (Weeks 11-12)
- [ ] Unit and integration testing
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation completion
- [ ] Production deployment with Coolify

## 📁 Project Structure

```
warehouse-management-system/
├── app/                          # Next.js 13+ app directory
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Main application routes
│   │   ├── inventory/            # Inventory management pages
│   │   ├── purchases/            # Purchase management pages
│   │   ├── transfers/            # Transfer management pages
│   │   ├── withdrawals/          # Withdrawal management pages
│   │   ├── reports/              # Reporting pages
│   │   └── settings/             # System settings pages
│   ├── api/                      # API routes
│   │   ├── auth/                 # NextAuth.js API routes
│   │   └── webhooks/             # External webhooks
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/                   # Reusable UI components
│   ├── ui/                       # Shadcn/UI components
│   ├── forms/                    # Form components
│   ├── tables/                   # Data table components
│   └── charts/                   # Chart components
├── lib/                          # Utility libraries
│   ├── auth.ts                   # NextAuth configuration
│   ├── db.ts                     # Database connection
│   ├── validations.ts            # Zod schemas
│   └── utils.ts                  # Utility functions
├── prisma/                       # Database schema and migrations
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Database migrations
│   └── seed.ts                   # Database seeding
├── store/                        # Zustand state management
│   ├── auth-store.ts             # Authentication state
│   ├── inventory-store.ts        # Inventory state
│   └── ui-store.ts               # UI state
├── types/                        # TypeScript type definitions
├── docs/                         # Documentation files
└── public/                       # Static assets
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/session` - Get current session

### Inventory Management
- `GET /api/inventory` - Get current inventory
- `POST /api/inventory/movements` - Create inventory movement
- `GET /api/inventory/history` - Get movement history

### Purchase Management
- `GET /api/purchases` - List purchase orders
- `POST /api/purchases` - Create purchase order
- `PUT /api/purchases/:id/approve` - Approve purchase order
- `POST /api/purchases/:id/receive` - Receive goods

### Transfer Management
- `GET /api/transfers` - List transfers
- `POST /api/transfers` - Create transfer
- `PUT /api/transfers/:id/approve` - Approve transfer
- `PUT /api/transfers/:id/execute` - Execute transfer

*Full API documentation available at `/docs/api` when running the development server.*

## 🚀 Deployment

### Using Coolify (Recommended)

1. **Setup Coolify instance**
   - Install Coolify on your server
   - Configure domain and SSL certificates

2. **Deploy application**
   - Connect your Git repository
   - Configure environment variables
   - Set up PostgreSQL database
   - Deploy with automatic builds

3. **Post-deployment**
   - Run database migrations
   - Configure backup schedules
   - Set up monitoring and alerts

### Manual Deployment

1. **Build application**
   ```bash
   npm run build
   ```

2. **Setup production database**
   ```bash
   npx prisma migrate deploy
   ```

3. **Start production server**
   ```bash
   npm start
   ```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: [Wiki](https://github.com/your-username/warehouse-management-system/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/warehouse-management-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/warehouse-management-system/discussions)

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**