"use client"

import React, { useState, useTransition } from "react"
import {
  Settings,
  Save,
  RefreshCw,
  Database,
  Bell,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { updateSystemSettings, type SystemSettings } from "@/lib/actions/settings-actions"
import { CostingMethodType } from "@prisma/client"
import { toast } from "sonner"

interface SettingsViewProps {
  initialSettings?: SystemSettings
}

export function SettingsView({ initialSettings }: SettingsViewProps) {
  const [settings, setSettings] = useState<SystemSettings>(initialSettings || {
    defaultCostingMethod: CostingMethodType.WEIGHTED_AVERAGE,
    autoApprovalThreshold: 0,
    lowStockNotifications: true,
    emailNotifications: true,
    auditLogRetentionDays: 365,
    backupFrequency: 'DAILY',
    maintenanceMode: false,
    systemName: 'Warehouse Management System',
    systemVersion: '1.0.0'
  })
  const [isPending, startTransition] = useTransition()

  const handleSaveSettings = () => {
    startTransition(async () => {
      const result = await updateSystemSettings(settings)
      
      if (result.success) {
        toast.success("Settings updated successfully")
      } else {
        toast.error(result.error || "Failed to update settings")
      }
    })
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleSaveSettings} disabled={isPending}>
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="systemName">System Name</Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => setSettings(prev => ({ ...prev, systemName: e.target.value }))}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemVersion">System Version</Label>
              <Input
                id="systemVersion"
                value={settings.systemVersion}
                onChange={(e) => setSettings(prev => ({ ...prev, systemVersion: e.target.value }))}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Maintenance Mode</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Switch 
                  id="maintenanceMode" 
                  checked={settings.maintenanceMode} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  disabled={isPending}
                />
                <Label htmlFor="maintenanceMode" className="text-sm">
                  Enable maintenance mode
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Inventory Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="defaultCostingMethod">Default Costing Method</Label>
              <Select
                value={settings.defaultCostingMethod}
                onValueChange={(value) => setSettings(prev => ({ ...prev, defaultCostingMethod: value as CostingMethodType }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(CostingMethodType).map((method) => (
                    <SelectItem key={method} value={method}>
                      {method.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="autoApprovalThreshold">Auto Approval Threshold</Label>
              <Input
                id="autoApprovalThreshold"
                type="number"
                step="0.01"
                min="0"
                value={settings.autoApprovalThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, autoApprovalThreshold: parseFloat(e.target.value) || 0 }))}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label>Low Stock Notifications</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Switch 
                  id="lowStockNotifications" 
                  checked={settings.lowStockNotifications} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, lowStockNotifications: checked }))}
                  disabled={isPending}
                />
                <Label htmlFor="lowStockNotifications" className="text-sm">
                  Enable low stock alerts
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email Notifications</Label>
              <div className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <Switch 
                  id="emailNotifications" 
                  checked={settings.emailNotifications} 
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
                  disabled={isPending}
                />
                <Label htmlFor="emailNotifications" className="text-sm">
                  Send email notifications
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              System Maintenance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="auditLogRetentionDays">Audit Log Retention (Days)</Label>
              <Input
                id="auditLogRetentionDays"
                type="number"
                min="30"
                max="3650"
                value={settings.auditLogRetentionDays}
                onChange={(e) => setSettings(prev => ({ ...prev, auditLogRetentionDays: parseInt(e.target.value) || 365 }))}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backupFrequency">Backup Frequency</Label>
              <Select
                value={settings.backupFrequency}
                onValueChange={(value) => setSettings(prev => ({ ...prev, backupFrequency: value }))}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOURLY">Hourly</SelectItem>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}