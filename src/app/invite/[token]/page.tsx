"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Users,
  Mail,
  User,
  Lock,
  Calendar,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Shield
} from "lucide-react"
import { useInvitations } from "@/contexts/InvitationContext"
import { useAuth } from "@/contexts/AuthContext"
import Logo from "@/components/Logo"

export default function InvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { getInvitationByToken, acceptInvitation, declineInvitation, loading } = useInvitations()
  const { signup } = useAuth()
  
  const [invitation, setInvitation] = useState<any>(null)
  const [showDeclineDialog, setShowDeclineDialog] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
    dateOfBirth: "",
    emergencyContact: ""
  })

  const token = params.token as string

  useEffect(() => {
    if (token) {
      const foundInvitation = getInvitationByToken(token)
      setInvitation(foundInvitation)
      
      if (foundInvitation) {
        setFormData(prev => ({
          ...prev,
          fullName: foundInvitation.studentName || ""
        }))
      }
    }
  }, [token, getInvitationByToken])

  const handleAcceptInvitation = async () => {
    if (!invitation) return

    setError("")
    setSuccess("")
    setIsProcessing(true)

    // Validate form
    if (!formData.fullName.trim()) {
      setError("Please enter your full name")
      setIsProcessing(false)
      return
    }

    if (!formData.password) {
      setError("Please enter a password")
      setIsProcessing(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsProcessing(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsProcessing(false)
      return
    }

    try {
      // First, accept the invitation
      const acceptResult = await acceptInvitation(token, {
        fullName: formData.fullName.trim(),
        password: formData.password,
        dateOfBirth: formData.dateOfBirth || undefined,
        emergencyContact: formData.emergencyContact || undefined
      })

      if (!acceptResult.success) {
        setError(acceptResult.error || "Failed to accept invitation")
        setIsProcessing(false)
        return
      }

      // Then create the user account
      const signupResult = await signup({
        email: invitation.studentEmail,
        password: formData.password,
        fullName: formData.fullName.trim(),
        role: "athlete"
      })

      if (signupResult.success) {
        setSuccess("Account created successfully! Redirecting to dashboard...")
        setTimeout(() => {
          router.push("/")
        }, 2000)
      } else {
        setError(signupResult.error || "Failed to create account")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    }

    setIsProcessing(false)
  }

  const handleDeclineInvitation = async () => {
    if (!invitation) return

    setError("")
    setIsProcessing(true)

    const result = await declineInvitation(token)

    if (result.success) {
      setSuccess("Invitation declined. You can close this page.")
    } else {
      setError(result.error || "Failed to decline invitation")
    }

    setIsProcessing(false)
    setShowDeclineDialog(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'accepted': return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'declined': return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'expired': return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertTriangle className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'declined': return <XCircle className="h-4 w-4" />
      case 'expired': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
          <div className="text-gray-600">Loading invitation...</div>
        </div>
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md ml-card ml-border">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h2 className="text-xl font-semibold ml-text-hi mb-2">Invalid Invitation</h2>
            <p className="ml-text-lo mb-4">This invitation link is invalid or has expired.</p>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (invitation.status !== 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md ml-card ml-border">
          <CardContent className="p-6 text-center">
            {invitation.status === 'accepted' ? (
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            ) : invitation.status === 'declined' ? (
              <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            ) : (
              <AlertTriangle className="h-12 w-12 mx-auto text-gray-500 mb-4" />
            )}
            <h2 className="text-xl font-semibold ml-text-hi mb-2">
              Invitation {invitation.status === 'accepted' ? 'Accepted' : invitation.status === 'declined' ? 'Declined' : 'Expired'}
            </h2>
            <p className="ml-text-lo mb-4">
              {invitation.status === 'accepted' 
                ? 'You have already accepted this invitation.'
                : invitation.status === 'declined'
                ? 'You have declined this invitation.'
                : 'This invitation has expired.'
              }
            </p>
            <Button onClick={() => router.push("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo size="lg" />
          <h1 className="text-3xl font-bold ml-text-hi mt-4">Join Your Team</h1>
          <p className="ml-text-md">Complete your account setup to join {invitation.teamName}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Invitation Details */}
          <Card className="ml-card ml-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Team Invitation</span>
              </CardTitle>
              <CardDescription>
                You've been invited to join a team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 ml-text-lo" />
                  <div>
                    <p className="text-sm font-medium ml-text-hi">Coach</p>
                    <p className="text-sm ml-text-lo">{invitation.coachName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 ml-text-lo" />
                  <div>
                    <p className="text-sm font-medium ml-text-hi">Team</p>
                    <p className="text-sm ml-text-lo">{invitation.teamName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 ml-text-lo" />
                  <div>
                    <p className="text-sm font-medium ml-text-hi">Institution</p>
                    <p className="text-sm ml-text-lo">{invitation.institution}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm ml-text-lo">Status</span>
                <Badge className={getStatusColor(invitation.status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(invitation.status)}
                    <span className="capitalize">{invitation.status}</span>
                  </div>
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm ml-text-lo">Expires</span>
                <span className="text-sm ml-text-hi">
                  {new Date(invitation.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Account Setup Form */}
          <Card className="ml-card ml-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Create Your Account</span>
              </CardTitle>
              <CardDescription>
                Set up your athlete account to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600">{success}</p>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Alex Chen"
                    className="ml-hover ml-border"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={invitation.studentEmail}
                    disabled
                    className="ml-hover ml-border bg-gray-50"
                  />
                  <p className="text-xs ml-text-lo mt-1">This is the email you were invited with</p>
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a secure password"
                    className="ml-hover ml-border"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm your password"
                    className="ml-hover ml-border"
                  />
                </div>

                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth (Optional)</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="ml-hover ml-border"
                  />
                </div>

                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact (Optional)</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                    placeholder="Parent/Guardian phone number"
                    className="ml-hover ml-border"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <AlertDialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex-1" disabled={isProcessing}>
                      Decline
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Decline Invitation</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to decline this invitation? You won't be able to join this team.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeclineInvitation}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Declining...
                          </>
                        ) : (
                          'Decline Invitation'
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button 
                  onClick={handleAcceptInvitation}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Accept & Join
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}















