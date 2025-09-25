"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { LogIn, UserPlus, Users, Trophy, Target, Activity, Brain, Shield, Play, Instagram, Linkedin, Mail, Award, AlertCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import Logo from "./Logo"
import { useAuth } from "@/contexts/FirebaseAuthContext"

export default function AuthScreen() {
  const { login, signup, loading } = useAuth()
  const searchParams = useSearchParams()
  const [isLogin, setIsLogin] = useState(true)
  const [userRole, setUserRole] = useState<"coach" | "athlete">("coach")
  const [error, setError] = useState("")
  const [invitationData, setInvitationData] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    institution: "",
    athleteCount: "",
    agreeToTerms: false
  })

  // Handle invitation token from URL
  useEffect(() => {
    const inviteToken = searchParams.get('invite')
    const mode = searchParams.get('mode')
    
    if (inviteToken && mode === 'signup') {
      // Load invitation data and switch to signup mode
      loadInvitationData(inviteToken)
      setIsLogin(false)
      setUserRole("athlete")
    }
  }, [searchParams])

  const loadInvitationData = async (token: string) => {
    try {
      const response = await fetch(`/api/invitations?token=${token}`)
      const data = await response.json()
      
      if (data.success && data.invitation) {
        setInvitationData(data.invitation)
        // Pre-fill form with invitation data
        setFormData(prev => ({
          ...prev,
          email: data.invitation.athleteEmail,
          fullName: data.invitation.athleteName || '',
          institution: data.invitation.institution || ''
        }))
      } else {
        setError("Invalid or expired invitation")
      }
    } catch (error) {
      console.error('Error loading invitation:', error)
      setError("Failed to load invitation data")
    }
  }

  const acceptInvitation = async (user: any) => {
    if (!invitationData || !user) return
    
    try {
      const response = await fetch('/api/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invitationId: invitationData.id,
          athleteId: user.id,
          athleteEmail: user.email,
          athleteName: user.fullName
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        console.log('✅ Invitation accepted successfully')
      } else {
        console.error('❌ Failed to accept invitation:', data.error)
        setError(data.error || 'Failed to accept invitation')
      }
    } catch (error) {
      console.error('Error accepting invitation:', error)
      setError('Failed to accept invitation')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (isLogin) {
      // Login logic
      if (!formData.email || !formData.password) {
        setError("Please fill in all required fields")
        return
      }

      const result = await login(formData.email, formData.password)
      if (result.success) {
        // Clear form on successful login - the auth state change will handle redirect
        resetForm()
      } else {
        setError(result.error || "Login failed")
      }
    } else {
      // Signup logic
      if (!formData.email || !formData.password || !formData.fullName) {
        setError("Please fill in all required fields")
        return
      }

      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match")
        return
      }

      if (!formData.agreeToTerms) {
        setError("Please agree to the terms and conditions")
        return
      }

      const signupData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        role: userRole,
        institution: formData.institution || undefined,
        athleteCount: formData.athleteCount ? parseInt(formData.athleteCount) : undefined
      }
      
      console.log('🔍 DEBUG: AuthScreen signupData.role:', signupData.role);
      console.log('🔍 DEBUG: AuthScreen userRole state:', userRole);
      console.log('🔍 DEBUG: AuthScreen invitationData:', invitationData);

      const result = await signup(signupData)
      if (result.success) {
        // If this was an invitation signup, accept the invitation
        if (invitationData) {
          await acceptInvitation(result.user)
        }
      } else {
        setError(result.error || "Signup failed")
      }
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (error) setError("")
  }

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      institution: "",
      athleteCount: "",
      agreeToTerms: false
    })
    setError("")
  }

  const handleModeSwitch = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  const founders = [
    {
      name: "Joshua Khurin",
      role: "Finance & Business Operations Lead",
      bio: "Economics and Data Science, UC Berkeley",
      image: "/joshua-khurin.jpg"
    },
    {
      name: "Eisha Hemchand",
      role: "Full-Stack Development Lead",
      bio: "Computer Science and Data Science, Rice University",
      image: "/eisha-hemchand.jpg"
    }
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Marketing Content (Scrollable) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 ml-bg relative overflow-y-auto">
        <div className="flex flex-col w-full p-12 relative z-10">
          {/* Header */}
          <div className="flex items-center space-x-3 mb-8">
            <Logo size="md" />
            <div>
              <h1 className="text-xl font-bold ml-text-hi">MotionLabs AI</h1>
              <p className="text-sm ml-text-md">for Coaches</p>
            </div>
          </div>

          {/* Hero Section */}
          <div className="mb-16">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl xl:text-6xl font-bold mb-6 leading-tight"
            >
              <span className="ml-text-hi">MotionLabs AI — the world's first </span>
              <span className="ml-cyan-primary">data-analytics video replay</span>
              <span className="ml-text-hi"> for gymnastics, built for </span>
              <span className="ml-cyan-primary">form correction</span>
              <span className="ml-text-hi"> and </span>
              <span className="ml-cyan-primary">injury prevention.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl ml-text-md leading-relaxed mb-8"
            >
              <span className="font-semibold ml-text-hi">World-class coaching enhancement</span>—using only a smartphone.
            </motion.p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start space-x-4 p-6 ml-card rounded-2xl border ml-border backdrop-blur-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 ml-cyan-bg rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-semibold ml-text-hi mb-2">Form Correction</h3>
                <p className="ml-text-md leading-relaxed">
                  Capture movements in 3D with a phone camera. Joint angles, posture, timing, and sequencing—measured precisely.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start space-x-4 p-6 ml-card rounded-2xl border ml-border backdrop-blur-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 ml-cyan-bg rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-semibold ml-text-hi mb-2">Injury-Risk Insights</h3>
                <p className="ml-text-md leading-relaxed">
                  Spot risky take-off and landing angles, asymmetries, and fatigue markers to help reduce common injuries.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start space-x-4 p-6 ml-card rounded-2xl border ml-border backdrop-blur-sm"
            >
              <div className="flex-shrink-0 w-12 h-12 ml-cyan-bg rounded-xl flex items-center justify-center">
                <Brain className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-semibold ml-text-hi mb-2">Coach-Level Progress Tracking</h3>
                <p className="ml-text-md leading-relaxed">
                  Movement IQ™ scores, trend lines, and session comparisons so coaches and athletes see objective progress.
                </p>
              </div>
            </motion.div>
          </div>

          {/* How It Works */}
          <div className="mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-3xl font-bold ml-text-hi mb-12"
            >
              How It Works
            </motion.h2>

            <div className="grid grid-cols-3 gap-8">
              {[
                { step: "1", title: "Record", desc: "Set phone down; record routine", icon: Play },
                { step: "2", title: "Analyze", desc: "AI computes 3D mesh & angles", icon: Brain },
                { step: "3", title: "Coach", desc: "Use objective metrics", icon: Trophy }
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 ml-nav rounded-full flex items-center justify-center border-2 border-cyan-500">
                    <span className="text-xl font-bold text-cyan-400">{item.step}</span>
                  </div>
                  <h3 className="text-lg font-semibold ml-text-hi mb-2">{item.title}</h3>
                  <p className="ml-text-md text-sm">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Meet the Founders */}
          <div className="mb-16">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="text-3xl font-bold ml-text-hi mb-12"
            >
              Meet the Founders
            </motion.h2>

            <div className="grid grid-cols-1 gap-8">
              {founders.map((founder, index) => (
                <motion.div
                  key={founder.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.0 + index * 0.1 }}
                  className="flex items-start space-x-6 p-6 ml-card rounded-2xl border ml-border backdrop-blur-sm"
                >
                  <img
                    src={founder.image}
                    alt={founder.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-cyan-500"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold ml-text-hi mb-1">{founder.name}</h3>
                    <p className="text-cyan-400 font-medium mb-3">{founder.role}</p>
                    <p className="ml-text-md leading-relaxed">{founder.bio}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-16 pt-8 border-t ml-border">
            <p className="ml-text-lo text-sm">
              © 2025 MotionLabs AI — A biomechanics assistant for coaches.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form (Sticky) */}
      <div className="w-full lg:w-1/2 xl:w-2/5 ml-nav flex items-center justify-center p-8 sticky top-0 h-screen overflow-y-auto">
        <div className="w-full max-w-md">
          <Card className="ml-card ml-border backdrop-blur-xl shadow-2xl">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4">
                <Logo size="lg" />
              </div>
              <CardTitle className="text-2xl font-bold ml-text-hi">
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription className="ml-text-md">
                {isLogin ? "Sign in to access your dashboard" : "Join MotionLabs AI today"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-sm text-red-400">{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Account Type Selection */}
                <div>
                  <Label className="ml-text-md">Account Type</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Button
                      type="button"
                      variant={userRole === "coach" ? "default" : "outline"}
                      className={`justify-center py-3 ${
                        userRole === "coach"
                          ? "ml-cyan-bg text-black hover:ml-cyan-hover"
                          : "ml-hover ml-border ml-text-hi hover:ml-cyan-hover"
                      }`}
                      onClick={() => setUserRole("coach")}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Coach
                    </Button>
                    <Button
                      type="button"
                      variant={userRole === "athlete" ? "default" : "outline"}
                      className={`justify-center py-3 ${
                        userRole === "athlete"
                          ? "ml-cyan-bg text-black hover:ml-cyan-hover"
                          : "ml-hover ml-border ml-text-hi hover:ml-cyan-hover"
                      }`}
                      onClick={() => setUserRole("athlete")}
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Athlete
                    </Button>
                  </div>
                </div>

                {/* Invitation Banner (Signup only) */}
                {!isLogin && invitationData && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="font-semibold text-blue-900">You're Invited!</h3>
                        <p className="text-sm text-blue-700">
                          {invitationData.coachName} has invited you to join {invitationData.institution || 'their team'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Full Name (Signup only) */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="fullName" className="ml-text-md">Full Name *</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="mt-1 ml-hover ml-border ml-text-hi"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                )}

                {/* Institution (Coach signup only) */}
                {!isLogin && userRole === "coach" && (
                  <div>
                    <Label htmlFor="institution" className="ml-text-md">Institution</Label>
                    <Input
                      id="institution"
                      type="text"
                      value={formData.institution}
                      onChange={(e) => handleInputChange("institution", e.target.value)}
                      className="mt-1 ml-hover ml-border ml-text-hi"
                      placeholder="Gym name or organization"
                    />
                  </div>
                )}

                {/* Athlete Count (Coach signup only) */}
                {!isLogin && userRole === "coach" && (
                  <div>
                    <Label htmlFor="athleteCount" className="ml-text-md">Number of Athletes</Label>
                    <Input
                      id="athleteCount"
                      type="number"
                      value={formData.athleteCount}
                      onChange={(e) => handleInputChange("athleteCount", e.target.value)}
                      className="mt-1 ml-hover ml-border ml-text-hi"
                      placeholder="Approximate number"
                      min="1"
                    />
                  </div>
                )}

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="ml-text-md">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="mt-1 ml-hover ml-border ml-text-hi"
                    placeholder="your@email.com"
                    disabled={!isLogin && invitationData ? true : false}
                    required
                  />
                  {!isLogin && invitationData && (
                    <p className="text-xs text-blue-600 mt-1">
                      Email pre-filled from invitation
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="ml-text-md">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className="mt-1 ml-hover ml-border ml-text-hi"
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    required
                  />
                </div>

                {/* Confirm Password (Signup only) */}
                {!isLogin && (
                  <div>
                    <Label htmlFor="confirmPassword" className="ml-text-md">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      className="mt-1 ml-hover ml-border ml-text-hi"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

                {/* Terms Agreement (Signup only) */}
                {!isLogin && (
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                      className="mt-1"
                    />
                    <Label htmlFor="agreeToTerms" className="text-sm ml-text-md leading-relaxed">
                      I agree to the{" "}
                      <a href="#" className="text-cyan-400 hover:text-cyan-300 underline">
                        Terms of Service
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-cyan-400 hover:text-cyan-300 underline">
                        Privacy Policy
                      </a>
                    </Label>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 ml-cyan-bg text-black hover:ml-cyan-hover font-semibold disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isLogin ? "Signing In..." : "Creating Account..."}
                    </>
                  ) : (
                    <>
                      {isLogin ? <LogIn className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                      {isLogin ? "Sign In" : "Create Account"} as {userRole === "coach" ? "Coach" : "Athlete"}
                    </>
                  )}
                </Button>
              </form>

              {/* Mode Switch */}
              <div className="text-center">
                <button
                  className="text-cyan-400 hover:text-cyan-300 text-sm font-medium"
                  onClick={handleModeSwitch}
                  disabled={loading}
                >
                  {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>

              {/* Demo Credentials */}
              {isLogin && (
                <div className="p-4 bg-gray-500/10 rounded-lg border border-gray-500/20">
                  <p className="text-xs ml-text-lo mb-2">Demo Credentials:</p>
                  <div className="text-xs space-y-1">
                    <p><strong>Coach:</strong> coach@example.com / coach123</p>
                    <p><strong>Athlete:</strong> athlete@example.com / athlete123</p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div className="flex justify-center space-x-4 pt-4 border-t ml-border">
                <a
                  href="https://instagram.com/motionlabs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 ml-hover rounded-lg transition-colors hover:bg-pink-500/20"
                >
                  <Instagram className="h-5 w-5 ml-text-lo hover:text-pink-400" />
                </a>
                <a
                  href="https://linkedin.com/company/motionlabs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 ml-hover rounded-lg transition-colors hover:bg-blue-500/20"
                >
                  <Linkedin className="h-5 w-5 ml-text-lo hover:text-blue-400" />
                </a>
                <a
                  href="mailto:hello@motionlabs.ai"
                  className="p-2 ml-hover rounded-lg transition-colors hover:bg-cyan-500/20"
                >
                  <Mail className="h-5 w-5 ml-text-lo hover:text-cyan-400" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
