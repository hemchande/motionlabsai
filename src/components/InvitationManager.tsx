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
  Users,
  Mail,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  Trash2,
  Send,
  Loader2
} from "lucide-react"
import { useInvitations } from "@/contexts/InvitationContext"
import { useAuth } from "@/contexts/AuthContext"

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

interface InvitationManagerProps {
  user: User | null;
}

export default function InvitationManager({ user }: InvitationManagerProps) {
  const { sendInvitation, getInvitationsByCoach, loading } = useInvitations()
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    studentEmail: "",
    studentName: "",
    teamName: user?.institution ? `${user.institution} Team` : "My Team"
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const invitations = user ? getInvitationsByCoach(user.id) : []

  const handleSendInvitation = async () => {
    if (!user) return

    setError("")
    setSuccess("")

    if (!inviteForm.studentEmail.trim()) {
      setError("Please enter a student email address")
      return
    }

    if (!inviteForm.teamName.trim()) {
      setError("Please enter a team name")
      return
    }

    const result = await sendInvitation({
      coachId: user.id,
      coachName: user.fullName,
      coachEmail: user.email,
      studentEmail: inviteForm.studentEmail.trim(),
      studentName: inviteForm.studentName.trim() || undefined,
      teamName: inviteForm.teamName.trim(),
      institution: user.institution || "Unknown Institution"
    })

    if (result.success) {
      setSuccess("Invitation sent successfully!")
      setInviteForm({
        studentEmail: "",
        studentName: "",
        teamName: user?.institution ? `${user.institution} Team` : "My Team"
      })
      setShowInviteDialog(false)
    } else {
      setError(result.error || "Failed to send invitation")
    }
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
      case 'pending': return <Clock className="h-4 w-4" />
      case 'accepted': return <CheckCircle className="h-4 w-4" />
      case 'declined': return <XCircle className="h-4 w-4" />
      case 'expired': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/invite/${token}`
    navigator.clipboard.writeText(link)
    // You could add a toast notification here
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Invitations</h1>
          <p className="text-gray-600 dark:text-gray-400">Invite students to join your team</p>
        </div>
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Send Invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send Team Invitation</DialogTitle>
              <DialogDescription>
                Invite a student to join your team. They'll receive an email with a link to create their account.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="student-email">Student Email *</Label>
                <Input
                  id="student-email"
                  type="email"
                  placeholder="student@example.com"
                  value={inviteForm.studentEmail}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, studentEmail: e.target.value }))}
                  className="hover:border-gray-300 dark:hover:border-gray-500 border border-gray-200 dark:border-gray-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="student-name">Student Name (Optional)</Label>
                <Input
                  id="student-name"
                  placeholder="Alex Chen"
                  value={inviteForm.studentName}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, studentName: e.target.value }))}
                  className="hover:border-gray-300 dark:hover:border-gray-500 border border-gray-200 dark:border-gray-600"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="team-name">Team Name *</Label>
                <Input
                  id="team-name"
                  placeholder="Elite Gymnastics Team"
                  value={inviteForm.teamName}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, teamName: e.target.value }))}
                  className="hover:border-gray-300 dark:hover:border-gray-500 border border-gray-200 dark:border-gray-600"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvitation}
                disabled={loading}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-green-800 font-medium">{success}</span>
          </div>
        </div>
      )}

      {/* Invitations List */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Mail className="h-5 w-5" />
            <span>Recent Invitations</span>
          </CardTitle>
          <CardDescription>
            Track the status of your team invitations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitations.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invitations yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Start building your team by sending invitations to students</p>
              <Button 
                onClick={() => setShowInviteDialog(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Send First Invitation
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {invitation.studentName || invitation.studentEmail}
                        </h3>
                        <Badge className={getStatusColor(invitation.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(invitation.status)}
                            <span className="capitalize">{invitation.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <Mail className="h-3 w-3 inline mr-1" />
                        {invitation.studentEmail}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Team: {invitation.teamName}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400">
                        <span>Sent: {formatDate(invitation.createdAt)}</span>
                        <span>Expires: {formatDate(invitation.expiresAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {invitation.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyInviteLink(invitation.token)}
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Link
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {invitations.filter(inv => inv.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Accepted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {invitations.filter(inv => inv.status === 'accepted').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Declined</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {invitations.filter(inv => inv.status === 'declined').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expired</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {invitations.filter(inv => inv.status === 'expired').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
