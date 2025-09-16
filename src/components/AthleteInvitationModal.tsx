"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  UserPlus, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Users,
  Building
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface AthleteInvitationModalProps {
  coachName: string
  coachEmail: string
  institution?: string
  onInvitationSent?: () => void
}

interface InvitationForm {
  athleteEmail: string
  athleteName: string
  customMessage: string
}

export default function AthleteInvitationModal({ 
  coachName, 
  coachEmail, 
  institution,
  onInvitationSent 
}: AthleteInvitationModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [invitationStatus, setInvitationStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [formData, setFormData] = useState<InvitationForm>({
    athleteEmail: '',
    athleteName: '',
    customMessage: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setInvitationStatus('idle')
    setErrorMessage('')

    try {
      const response = await fetch('/api/invite-athlete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coachName,
          coachEmail,
          athleteEmail: formData.athleteEmail,
          athleteName: formData.athleteName || undefined,
          institution,
          customMessage: formData.customMessage || undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        setInvitationStatus('success')
        setFormData({
          athleteEmail: '',
          athleteName: '',
          customMessage: ''
        })
        
        // Call callback if provided
        if (onInvitationSent) {
          onInvitationSent()
        }
        
        // Close modal after 2 seconds
        setTimeout(() => {
          setIsOpen(false)
          setInvitationStatus('idle')
        }, 2000)
      } else {
        setInvitationStatus('error')
        setErrorMessage(result.error || 'Failed to send invitation')
      }
    } catch (error) {
      setInvitationStatus('error')
      setErrorMessage('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof InvitationForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      athleteEmail: '',
      athleteName: '',
      customMessage: ''
    })
    setInvitationStatus('idle')
    setErrorMessage('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          className="ml-cyan-bg text-black hover:ml-cyan-hover"
          onClick={() => setIsOpen(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Athlete
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Invite Athlete</span>
          </DialogTitle>
          <DialogDescription>
            Send an email invitation to an athlete to join your team on Gymnastics Analytics.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coach Info Display */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Inviting as: {coachName}
                  </p>
                  <p className="text-xs text-blue-700">{coachEmail}</p>
                  {institution && (
                    <div className="flex items-center space-x-1 mt-1">
                      <Building className="h-3 w-3 text-blue-600" />
                      <p className="text-xs text-blue-700">{institution}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Athlete Email */}
          <div className="space-y-2">
            <Label htmlFor="athleteEmail" className="text-sm font-medium">
              Athlete Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="athleteEmail"
              type="email"
              placeholder="athlete@example.com"
              value={formData.athleteEmail}
              onChange={(e) => handleInputChange('athleteEmail', e.target.value)}
              required
              className="w-full"
            />
          </div>

          {/* Athlete Name (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="athleteName" className="text-sm font-medium">
              Athlete Name (Optional)
            </Label>
            <Input
              id="athleteName"
              type="text"
              placeholder="Enter athlete's name"
              value={formData.athleteName}
              onChange={(e) => handleInputChange('athleteName', e.target.value)}
              className="w-full"
            />
          </div>

          {/* Custom Message (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="customMessage" className="text-sm font-medium">
              Custom Message (Optional)
            </Label>
            <Textarea
              id="customMessage"
              placeholder="Add a personal message to your invitation..."
              value={formData.customMessage}
              onChange={(e) => handleInputChange('customMessage', e.target.value)}
              rows={3}
              className="w-full"
            />
          </div>

          {/* Status Messages */}
          <AnimatePresence mode="wait">
            {invitationStatus === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Invitation sent successfully!
                </span>
              </motion.div>
            )}

            {invitationStatus === 'error' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 font-medium">
                  {errorMessage}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                resetForm()
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading || !formData.athleteEmail}
              className="ml-cyan-bg text-black hover:ml-cyan-hover"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>

        {/* What Athletes Get */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">What athletes will get:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>AI Motion Analysis</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>ACL Risk Assessment</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Performance Tracking</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Personal Dashboard</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}












