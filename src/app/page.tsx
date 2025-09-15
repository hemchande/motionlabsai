"use client"

import { useEffect, useState } from "react"
import MainDashboard from "@/components/MainDashboard"
import AuthScreen from "@/components/AuthScreen"
import { useAuth } from "@/contexts/AuthContext"
import GlobalProcessingIndicator from "@/components/GlobalProcessingIndicator"

export default function Home() {
  const { isAuthenticated, user, userRole, logout, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading MotionLabs AI...</div>
      </div>
    )
  }

  // Show loading screen while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading MotionLabs AI...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen flex">
      <MainDashboard
        userRole={userRole}
        onLogout={logout}
        user={user}
      />
      <GlobalProcessingIndicator />
    </div>
  )
}
