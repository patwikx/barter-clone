"use client"

import React, { useState } from "react"
import {
  HelpCircle,
  Search,
  Book,
  Video,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  ChevronRight,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  Truck,
  Settings,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const helpCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Book,
    description: "Learn the basics of using the warehouse management system",
    articles: [
      { title: "System Overview", description: "Understanding the main features and navigation" },
      { title: "User Roles and Permissions", description: "How roles and permissions work" },
      { title: "Setting Up Your First Warehouse", description: "Step-by-step warehouse setup guide" },
      { title: "Adding Items to Catalog", description: "How to add and manage inventory items" },
    ]
  },
  {
    id: "inventory",
    title: "Inventory Management",
    icon: Package,
    description: "Managing your inventory and stock levels",
    articles: [
      { title: "Current Stock Overview", description: "Understanding inventory levels and status" },
      { title: "Low Stock Alerts", description: "Setting up and managing reorder levels" },
      { title: "Inventory Movements", description: "Tracking all inventory transactions" },
      { title: "Physical Count Adjustments", description: "Performing cycle counts and adjustments" },
    ]
  },
  {
    id: "purchases",
    title: "Purchase Management",
    icon: ShoppingCart,
    description: "Creating and managing purchase orders",
    articles: [
      { title: "Creating Purchase Orders", description: "How to create and submit purchase orders" },
      { title: "Approval Workflows", description: "Understanding the approval process" },
      { title: "Receiving Goods", description: "Processing goods receipts and updating inventory" },
      { title: "Supplier Management", description: "Managing supplier information and relationships" },
    ]
  },
  {
    id: "transfers",
    title: "Stock Transfers",
    icon: ArrowRightLeft,
    description: "Moving inventory between warehouses",
    articles: [
      { title: "Creating Transfer Requests", description: "How to request stock transfers" },
      { title: "Transfer Approval Process", description: "Approving and executing transfers" },
      { title: "Inter-warehouse Movements", description: "Understanding transfer workflows" },
      { title: "Transfer History and Tracking", description: "Monitoring transfer status and history" },
    ]
  },
  {
    id: "withdrawals",
    title: "Material Withdrawals",
    icon: Truck,
    description: "Requesting and processing material withdrawals",
    articles: [
      { title: "Creating Withdrawal Requests", description: "How to request materials for production" },
      { title: "Withdrawal Approval", description: "Approving withdrawal requests" },
      { title: "Cost Allocation", description: "Understanding withdrawal costing" },
      { title: "Purpose and Project Tracking", description: "Tracking material usage by purpose" },
    ]
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    icon: BarChart3,
    description: "Generating reports and analyzing data",
    articles: [
      { title: "Inventory Reports", description: "Stock level and valuation reports" },
      { title: "Movement Reports", description: "Transaction history and audit trails" },
      { title: "Cost Analysis", description: "Cost variance and profitability analysis" },
      { title: "Export and Scheduling", description: "Exporting data and scheduling reports" },
    ]
  },
]

const faqItems = [
  {
    question: "How do I reset my password?",
    answer: "You can reset your password by going to your profile page and clicking 'Change Password', or contact your system administrator for assistance."
  },
  {
    question: "Why can't I see certain menu items?",
    answer: "Menu visibility is based on your user role and permissions. Contact your administrator if you need access to additional features."
  },
  {
    question: "How do I create a purchase order?",
    answer: "Navigate to Purchases > Create Purchase Order, select your supplier, add items with quantities and costs, then submit for approval."
  },
  {
    question: "What happens when inventory goes below reorder level?",
    answer: "The system will automatically flag items as low stock and can send notifications to relevant users based on your notification settings."
  },
  {
    question: "How do I transfer items between warehouses?",
    answer: "Go to Transfers > Create Transfer, select source and destination warehouses, add items with quantities, then submit for approval."
  },
  {
    question: "Can I export inventory data?",
    answer: "Yes, most screens have an 'Export' button that allows you to download data in Excel or CSV format."
  },
]

export function HelpView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredCategories = helpCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.articles.some(article => 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const filteredFAQs = faqItems.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
          <p className="text-gray-600 mt-1">Find answers and get help with the warehouse management system</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search help articles, FAQs, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Video className="w-8 h-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Video Tutorials</h3>
            <p className="text-sm text-gray-500">Watch step-by-step video guides</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Live Chat Support</h3>
            <p className="text-sm text-gray-500">Get instant help from our support team</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-6 text-center">
            <Mail className="w-8 h-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Email Support</h3>
            <p className="text-sm text-gray-500">Send us a detailed support request</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Help Categories */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="w-5 h-5 mr-2" />
                Help Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredCategories.map((category) => {
                const CategoryIcon = category.icon
                return (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                    onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CategoryIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{category.title}</h3>
                          <p className="text-sm text-gray-500">{category.description}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                        selectedCategory === category.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                    
                    {selectedCategory === category.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="space-y-2">
                          {category.articles.map((article, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                            >
                              <div>
                                <div className="font-medium text-sm text-gray-900">{article.title}</div>
                                <div className="text-xs text-gray-500">{article.description}</div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {filteredFAQs.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Support Sidebar */}
        <div className="space-y-6">
          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Email Support</div>
                    <div className="text-xs text-gray-500">support@company.com</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Phone Support</div>
                    <div className="text-xs text-gray-500">+1 (555) 123-4567</div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium">Live Chat</div>
                    <div className="text-xs text-gray-500">Available 24/7</div>
                  </div>
                </div>
              </div>
              
              <Button className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Start Live Chat
              </Button>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">System Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Operational
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Update</span>
                  <span className="text-sm font-medium">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Version</span>
                  <span className="text-sm font-medium">v1.0.0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Book className="w-4 h-4 mr-2" />
                User Manual
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Video className="w-4 h-4 mr-2" />
                Training Videos
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Settings className="w-4 h-4 mr-2" />
                API Documentation
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}