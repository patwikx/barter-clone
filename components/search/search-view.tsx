"use client"

import React, { useState, useTransition } from "react"
import {
  Search,
  Package,
  ShoppingCart,
  ArrowRightLeft,
  Truck,
  Building,
  Users,
  Calendar,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { performGlobalSearch, type SearchResult } from "@/lib/actions/search-actions"
import { toast } from "sonner"
import Link from "next/link"

const getResultIcon = (type: string) => {
  switch (type) {
    case 'ITEM':
      return Package
    case 'PURCHASE':
      return ShoppingCart
    case 'TRANSFER':
      return ArrowRightLeft
    case 'WITHDRAWAL':
      return Truck
    case 'WAREHOUSE':
      return Building
    case 'SUPPLIER':
      return Building
    case 'USER':
      return Users
    default:
      return Package
  }
}

const getResultColor = (type: string) => {
  switch (type) {
    case 'ITEM':
      return "bg-blue-100 text-blue-800"
    case 'PURCHASE':
      return "bg-green-100 text-green-800"
    case 'TRANSFER':
      return "bg-purple-100 text-purple-800"
    case 'WITHDRAWAL':
      return "bg-orange-100 text-orange-800"
    case 'WAREHOUSE':
      return "bg-indigo-100 text-indigo-800"
    case 'SUPPLIER':
      return "bg-cyan-100 text-cyan-800"
    case 'USER':
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getResultUrl = (result: SearchResult) => {
  switch (result.type) {
    case 'ITEM':
      return `/dashboard/items/${result.id}`
    case 'PURCHASE':
      return `/dashboard/purchases/${result.id}`
    case 'TRANSFER':
      return `/dashboard/transfers/${result.id}`
    case 'WITHDRAWAL':
      return `/dashboard/withdrawals/${result.id}`
    case 'WAREHOUSE':
      return `/dashboard/warehouse/${result.id}`
    case 'SUPPLIER':
      return `/dashboard/suppliers/${result.id}`
    case 'USER':
      return `/dashboard/users/${result.id}`
    default:
      return '#'
  }
}

export function SearchView() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query")
      return
    }

    startTransition(async () => {
      const result = await performGlobalSearch({
        query: searchQuery,
        type: selectedType === "all" ? undefined : selectedType
      })
      
      if (result.success) {
        setSearchResults(result.data || [])
        setHasSearched(true)
        toast.success(`Found ${result.data?.length || 0} results`)
      } else {
        toast.error(result.error || "Search failed")
        setSearchResults([])
        setHasSearched(true)
      }
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const groupedResults = searchResults.reduce((groups, result) => {
    const type = result.type
    if (!groups[type]) {
      groups[type] = []
    }
    groups[type].push(result)
    return groups
  }, {} as Record<string, SearchResult[]>)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Search</h1>
          <p className="text-gray-600 mt-1">Search across all system data including items, orders, transfers, and more</p>
        </div>
      </div>

      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label>Search Query</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search items, orders, suppliers, users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Search Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ITEM">Items</SelectItem>
                  <SelectItem value="PURCHASE">Purchases</SelectItem>
                  <SelectItem value="TRANSFER">Transfers</SelectItem>
                  <SelectItem value="WITHDRAWAL">Withdrawals</SelectItem>
                  <SelectItem value="WAREHOUSE">Warehouses</SelectItem>
                  <SelectItem value="SUPPLIER">Suppliers</SelectItem>
                  <SelectItem value="USER">Users</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleSearch} disabled={isPending || !searchQuery.trim()} className="w-full">
                {isPending ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Search Results
              </span>
              <Badge variant="outline">
                {searchResults.length} results
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Search className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-500 text-center">
                  No items match your search query &quot;{searchQuery}&quot;. Try different keywords or check your spelling.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedResults).map(([type, results]) => {
                  const TypeIcon = getResultIcon(type)
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center space-x-2 mb-4">
                        <TypeIcon className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          {type.charAt(0) + type.slice(1).toLowerCase()}s
                        </h3>
                        <Badge variant="outline">{results.length}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((result) => {
                          const ResultIcon = getResultIcon(result.type)
                          const resultUrl = getResultUrl(result)
                          
                          return (
                            <div
                              key={result.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ResultIcon className="w-5 h-5 text-gray-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {result.title}
                                      </h4>
                                      <Badge className={getResultColor(result.type)}>
                                        {result.type}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                      {result.description}
                                    </p>
                                    {result.metadata && (
                                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <div className="flex items-center space-x-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>{result.metadata.date}</span>
                                        </div>
                                        {result.metadata.status && (
                                          <div className="flex items-center space-x-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                            <span>{result.metadata.status}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2 ml-4">
                                  <Button variant="ghost" size="sm" asChild>
                                    <Link href={resultUrl}>
                                      <Eye className="w-4 h-4" />
                                    </Link>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}