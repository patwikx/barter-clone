"use client"

import * as z from "zod"
import { useForm, Controller } from "react-hook-form"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { Eye, EyeOff, Package, Warehouse, TrendingUp, Shield, Users, BarChart3 } from "lucide-react"

// Keep your original imports and schema
import { LoginSchema } from "@/lib/validations/login-schema"
import { login } from "@/lib/auth-actions/login"

// Custom styled alert components for errors and success
const FormError = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-red-950/20 border border-red-800/30 text-red-400 px-4 py-3 rounded-md mb-4">
      {message}
    </div>
  )
}

const FormSuccess = ({ message }: { message?: string }) => {
  if (!message) return null
  return (
    <div className="bg-green-950/20 border border-green-800/30 text-green-400 px-4 py-3 rounded-md mb-4">
      {message}
    </div>
  )
}

// Feature item component for the left panel
const FeatureItem = ({ icon: Icon, title, description }: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string 
}) => (
  <div className="flex gap-4 mb-8">
    <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 flex items-center justify-center min-w-[48px] h-12">
      <Icon className="text-blue-400 w-5 h-5" />
    </div>
    <div>
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-zinc-400 text-sm leading-relaxed">{description}</p>
    </div>
  </div>
)

export const LoginForm = () => {
  const searchParams = useSearchParams()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const callbackUrl = searchParams?.get("callbackUrl")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [error, setError] = useState<string | undefined>("")
  const [success, setSuccess] = useState<string | undefined>("")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      username: "",
      passwordHash: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("")
    setSuccess("")
    setIsLoading(true)
    try {
      const data = await login(values)
      if (data?.error) {
        setError(data.error)
      } else if (data.success) {
        window.location.assign("/dashboard")
      }
    } catch (error) {
      setError(`An unexpected error occurred. Please try again. ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Left Panel - Warehouse Features */}
      <div className="hidden lg:flex lg:w-3/5 bg-black p-8 xl:p-16 flex-col justify-center">
        {/* Logo and Brand */}
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-2">
              <Warehouse className="text-blue-400 w-8 h-8" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">Warehouse Management System</h1>
              <p className="text-zinc-500 text-sm">Enterprise Inventory Control</p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="max-w-lg">
          <FeatureItem
            icon={Package}
            title="Multi-Warehouse Inventory Control"
            description="Track inventory across multiple locations with real-time stock levels, automated reorder points, and comprehensive movement history."
          />
          
          <FeatureItem
            icon={TrendingUp}
            title="Advanced Cost Accounting"
            description="Support for FIFO, LIFO, and Weighted Average costing methods with detailed variance analysis and monthly cost summaries."
          />
          
          <FeatureItem
            icon={Users}
            title="Role-Based Access Control"
            description="Granular permissions system with approval workflows for purchases, transfers, and inventory adjustments."
          />
          
          <FeatureItem
            icon={BarChart3}
            title="Comprehensive Reporting"
            description="Real-time dashboards, inventory reports, cost analysis, and complete audit trails for regulatory compliance."
          />
          
          <FeatureItem
            icon={Shield}
            title="Enterprise Security & Audit"
            description="Complete transaction logging, user activity tracking, and secure data handling for enterprise environments."
          />
        </div>

        {/* Bottom accent */}
        <div className="mt-16 pt-8 border-t border-zinc-800">
          <p className="text-zinc-600 text-xs">
            Enterprise-grade inventory management • SOC 2 Compliant • 24/7 Support Available
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-2/5 bg-black flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-2">
              <Warehouse className="text-blue-400 w-6 h-6" />
            </div>
            <div className="text-center">
              <h1 className="text-white text-lg font-bold">WMS</h1>
              <p className="text-zinc-500 text-xs">Warehouse System</p>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-white text-2xl font-semibold mb-2">
              {showTwoFactor ? "Two-Factor Authentication" : "Sign In"}
            </h2>
            {!showTwoFactor && (
              <p className="text-zinc-400">Access your warehouse management system</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {showTwoFactor ? (
              // --- 2FA Code Field ---
              <div>
                <label className="block text-zinc-300 text-sm font-medium mb-2">
                  Verification Code
                </label>
                <Controller
                  name="code"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="123456"
                      disabled={isLoading}
                      className="w-full h-12 bg-black border border-zinc-800 rounded-md px-4 text-white text-lg tracking-wider text-center focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  )}
                />
                {errors.code && (
                  <p className="text-red-400 text-sm mt-1">{errors.code.message}</p>
                )}
              </div>
            ) : (
              <>
                {/* --- Username Field --- */}
                <div>
                  <label className="block text-zinc-300 text-sm font-medium mb-2">
                    Username
                  </label>
                  <Controller
                    name="username"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter your username"
                        disabled={isLoading}
                        className="w-full h-12 bg-black border border-zinc-800 rounded-md px-4 text-white focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    )}
                  />
                  {errors.username && (
                    <p className="text-red-400 text-sm mt-1">{errors.username.message}</p>
                  )}
                </div>

                {/* --- Password Field --- */}
                <div>
                  <label className="block text-zinc-300 text-sm font-medium mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Controller
                      name="passwordHash"
                      control={control}
                      render={({ field }) => (
                        <input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          disabled={isLoading}
                          className="w-full h-12 bg-black border border-zinc-800 rounded-md px-4 pr-12 text-white focus:border-blue-500 focus:outline-none transition-colors"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-blue-400 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.passwordHash && (
                    <p className="text-red-400 text-sm mt-1">{errors.passwordHash.message}</p>
                  )}
                </div>

                {/* --- Remember Me --- */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-blue-600 bg-black border-zinc-700 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="remember" className="ml-2 text-zinc-400 text-sm">
                      Remember me
                    </label>
                  </div>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </>
            )}

            {/* Error and Success Messages */}
            <FormError message={error} />
            <FormSuccess message={success} />

            {/* --- Submit Button --- */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{showTwoFactor ? "Verifying..." : "Signing in..."}</span>
                </>
              ) : (
                <span>{showTwoFactor ? "Verify & Access" : "Sign In"}</span>
              )}
            </button>

            {/* Footer Links */}
            {!showTwoFactor && (
              <div className="text-center pt-4 border-t border-zinc-900">
                <p className="text-zinc-500 text-sm">
                  Need system access?{' '}
                  <Link 
                    href="/auth/register" 
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Request Account
                  </Link>
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}