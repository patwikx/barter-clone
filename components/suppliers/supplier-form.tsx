"use client"

import React, { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DialogFooter } from "@/components/ui/dialog"
import { type CreateSupplierInput, type UpdateSupplierInput, type SupplierWithDetails } from "@/lib/actions/supplier-actions"

// Create a unified form data type
interface SupplierFormData {
  name: string
  contactInfo: string
  purchaseReference: string
}

interface SupplierFormProps {
  supplier?: SupplierWithDetails
  onSubmit: (data: CreateSupplierInput | UpdateSupplierInput) => void
  onCancel: () => void
  isLoading: boolean
}

export function SupplierForm({ supplier, onSubmit, onCancel, isLoading }: SupplierFormProps) {
  const [formData, setFormData] = useState<SupplierFormData>({
    name: supplier?.name || "",
    contactInfo: supplier?.contactInfo || "",
    purchaseReference: supplier?.purchaseReference || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Transform form data based on whether we're creating or updating
    if (supplier) {
      // For updates, only send changed fields
      const updateData: UpdateSupplierInput = {}
      
      if (formData.name !== supplier.name) {
        updateData.name = formData.name
      }
      if (formData.contactInfo !== (supplier.contactInfo || "")) {
        updateData.contactInfo = formData.contactInfo || undefined
      }
      if (formData.purchaseReference !== (supplier.purchaseReference || "")) {
        updateData.purchaseReference = formData.purchaseReference || undefined
      }

      // Always include name for updates to ensure it's not undefined
      if (!updateData.name) {
        updateData.name = formData.name
      }

      onSubmit(updateData)
    } else {
      // For creation, send all required fields
      const createData: CreateSupplierInput = {
        name: formData.name,
        contactInfo: formData.contactInfo || undefined,
        purchaseReference: formData.purchaseReference || undefined,
      }
      
      onSubmit(createData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Supplier Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter supplier name"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactInfo">Contact Information</Label>
        <Textarea
          id="contactInfo"
          value={formData.contactInfo}
          onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
          placeholder="Enter contact information (email, phone, address, etc.)"
          disabled={isLoading}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="purchaseReference">Purchase Reference</Label>
        <Input
          id="purchaseReference"
          value={formData.purchaseReference}
          onChange={(e) => setFormData(prev => ({ ...prev, purchaseReference: e.target.value }))}
          placeholder="Enter purchase reference code"
          disabled={isLoading}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !formData.name.trim()}>
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {supplier ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>{supplier ? "Update Supplier" : "Create Supplier"}</>
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}