"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
import { LogOut, AlertTriangle } from "lucide-react"

interface LogoutConfirmationProps {
  onLogout: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export default function LogoutConfirmation({ onLogout, loading = false, children }: LogoutConfirmationProps) {
  const [showDialog, setShowDialog] = useState(false)

  const handleLogout = () => {
    onLogout()
    setShowDialog(false)
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-3 ml-text-md hover:text-red-400 hover:ml-hover"
            disabled={loading}
          >
            <LogOut className="h-4 w-4 mr-3" />
            <div className="text-left">
              <div className="font-medium text-sm">Sign Out</div>
              <div className="text-xs opacity-70">End session</div>
            </div>
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to sign out? You will need to log in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700"
            disabled={loading}
          >
            {loading ? "Signing Out..." : "Sign Out"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}















