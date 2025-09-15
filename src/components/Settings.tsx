"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  User,
  LogOut,
  Trash2,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Palette,
  Key,
  Calendar,
  Mail,
  Building,
  Users as UsersIcon,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

interface User {
  id: string;
  email: string;
  fullName: string;
  role: "coach" | "athlete";
  institution?: string;
  athleteCount?: number;
  createdAt: string;
  lastLogin: string;
}

interface SettingsProps {
  userRole: "coach" | "athlete";
  user: User | null;
}

export default function Settings({ userRole, user }: SettingsProps) {
  const { logout, deleteAccount, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [deletePassword, setDeletePassword] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your password to confirm account deletion")
      return
    }

    setDeleteError("")
    const result = await deleteAccount(deletePassword)
    
    if (result.success) {
      setDeleteSuccess(true)
      setShowDeleteDialog(false)
      // The logout will be handled by the deleteAccount function
    } else {
      setDeleteError(result.error || "Failed to delete account")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (role: string) => {
    return role === "coach" ? "bg-blue-500/20 text-blue-600 border-blue-500/30" : "bg-green-500/20 text-green-600 border-green-500/30"
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold ml-text-hi">Settings</h1>
          <p className="ml-text-md">Manage your account and preferences</p>
        </div>
        <SettingsIcon className="h-8 w-8 ml-text-lo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card className="ml-card ml-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile Information</span>
            </CardTitle>
            <CardDescription>
              Your account details and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user && (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold ml-text-hi">{user.fullName}</h3>
                    <p className="text-sm ml-text-lo">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm ml-text-md">Account Type</span>
                    <Badge className={getRoleColor(user.role)}>
                      {user.role === "coach" ? "Coach" : "Athlete"}
                    </Badge>
                  </div>

                  {user.institution && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm ml-text-md">Institution</span>
                      <span className="text-sm ml-text-hi flex items-center">
                        <Building className="h-4 w-4 mr-1" />
                        {user.institution}
                      </span>
                    </div>
                  )}

                  {user.athleteCount && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm ml-text-md">Athletes Managed</span>
                      <span className="text-sm ml-text-hi flex items-center">
                        <UsersIcon className="h-4 w-4 mr-1" />
                        {user.athleteCount}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm ml-text-md">Member Since</span>
                    <span className="text-sm ml-text-hi flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(user.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm ml-text-md">Last Login</span>
                    <span className="text-sm ml-text-hi flex items-center">
                      <Mail className="h-4 w-4 mr-1" />
                      {formatDate(user.lastLogin)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="ml-card ml-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Preferences</span>
            </CardTitle>
            <CardDescription>
              Customize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs ml-text-lo">Choose your preferred theme</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTheme}
                className="ml-hover ml-border"
              >
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notifications</Label>
                <p className="text-xs ml-text-lo">Manage your notification preferences</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-hover ml-border"
              >
                <Bell className="h-4 w-4 mr-2" />
                Configure
              </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Privacy</Label>
                <p className="text-xs ml-text-lo">Manage your privacy settings</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="ml-hover ml-border"
              >
                <Shield className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card className="ml-card ml-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Account Actions</span>
            </CardTitle>
            <CardDescription>
              Manage your account security and access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start ml-hover ml-border"
                onClick={logout}
                disabled={loading}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
                {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              </Button>

              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span>Delete Account</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <p className="font-medium">Warning:</p>
                          <ul className="mt-1 space-y-1">
                            <li>• All your videos and analysis data will be permanently deleted</li>
                            <li>• Your account cannot be recovered</li>
                            <li>• All associated data will be removed</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete-password">Enter your password to confirm</Label>
                      <Input
                        id="delete-password"
                        type="password"
                        placeholder="Enter your password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="ml-hover ml-border"
                      />
                      {deleteError && (
                        <p className="text-sm text-red-600 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          {deleteError}
                        </p>
                      )}
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => {
                      setDeletePassword("")
                      setDeleteError("")
                    }}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Account
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        <Card className="ml-card ml-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </CardTitle>
            <CardDescription>
              Manage your account security settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start ml-hover ml-border"
              >
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start ml-hover ml-border"
              >
                <Shield className="h-4 w-4 mr-2" />
                Two-Factor Authentication
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start ml-hover ml-border"
              >
                <Bell className="h-4 w-4 mr-2" />
                Login Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Message */}
      {deleteSuccess && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">Account deleted successfully</span>
          </div>
        </div>
      )}
    </div>
  )
}
