"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  User,
  Calendar,
  Activity,
  Trophy,
  TrendingUp,
  Mail,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Video,
  Shield,
  CheckCircle,
  HelpCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import InvitationManager from "./InvitationManager"
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

interface AthleteManagementProps {
  userRole: "coach" | "athlete"
  selectedAthlete: string
  onAthleteChange: (athlete: string) => void
  user: User | null
}

// Mock athlete data
const mockAthletes = [
  {
    id: "athlete-1",
    name: "Alex Chen",
    email: "alex.chen@example.com",
    age: 16,
    level: "Advanced",
    events: ["Vault", "Bars", "Beam", "Floor"],
    motionIQ: 94,
    sessions: 12,
    lastSession: "2024-01-15",
    improvement: "+8%",
    status: "active"
  },
  {
    id: "athlete-2",
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    age: 15,
    level: "Intermediate",
    events: ["Vault", "Floor"],
    motionIQ: 87,
    sessions: 8,
    lastSession: "2024-01-12",
    improvement: "+12%",
    status: "active"
  },
  {
    id: "athlete-3",
    name: "Michael Rodriguez",
    email: "michael.rodriguez@example.com",
    age: 17,
    level: "Elite",
    events: ["Vault", "Bars", "Beam", "Floor"],
    motionIQ: 96,
    sessions: 15,
    lastSession: "2024-01-14",
    improvement: "+5%",
    status: "active"
  }
]

export default function AthleteManagement({ userRole, selectedAthlete, onAthleteChange, user }: AthleteManagementProps) {
  const [activeTab, setActiveTab] = useState<"roster" | "invitations">("roster")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredAthletes = mockAthletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'elite': return 'bg-purple-500/20 text-purple-600 border-purple-500/30'
      case 'advanced': return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      case 'intermediate': return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'beginner': return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-500/20 text-green-600 border-green-500/30'
      : 'bg-gray-500/20 text-gray-600 border-gray-500/30'
  }

  // Statistics data for the banners
  const stats = {
    totalSessions: mockAthletes.reduce((sum, athlete) => sum + athlete.sessions, 0),
    avgMotionIQ: Math.round(mockAthletes.reduce((sum, athlete) => sum + athlete.motionIQ, 0) / mockAthletes.length),
    avgACLRisk: 18, // Mock average ACL risk
    completedAnalyses: mockAthletes.reduce((sum, athlete) => sum + athlete.sessions, 0) - 3 // Mock completed analyses
  }

  // Helper function to get IQ color based on score
  const getIQColor = (score: number) => {
    if (score >= 90) return 'text-green-300' // High - Very Light Green
    if (score >= 70) return 'text-yellow-500' // Medium - Yellow
    return 'text-red-500' // Low - Red
  }

  if (userRole === "athlete") {
    return (
      <TooltipProvider>
        <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your athlete profile and settings</p>
          </div>
          <User className="h-8 w-8 text-gray-500 dark:text-gray-400" />
        </div>

        {/* Profile Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Alex Chen</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">alex.chen@example.com</p>
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    Active Athlete
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Age</span>
                  <span className="text-sm text-gray-900 dark:text-white">16 years old</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
                  <Badge className={getLevelColor("Advanced")}>Advanced</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Events</span>
                  <span className="text-sm text-gray-900 dark:text-white">Vault, Bars, Beam, Floor</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">January 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Performance Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-500">94</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Motion IQ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">12</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">+8%</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">4</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="h-5 w-5" />
                <span>Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-900 dark:text-white">First Session Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-900 dark:text-white">Motion IQ &gt; 90</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-900 dark:text-white">5 Sessions in a Month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </TooltipProvider>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {activeTab === "roster" ? "My Athletes" : "Team Invitations"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === "roster" 
              ? "Manage your athlete roster and track performance" 
              : "Invite students to join your team"
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={activeTab === "roster" ? "default" : "outline"}
            onClick={() => setActiveTab("roster")}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
          >
            <Users className="h-4 w-4 mr-2" />
            Roster
          </Button>
          <Button
            variant={activeTab === "invitations" ? "default" : "outline"}
            onClick={() => setActiveTab("invitations")}
            className="hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
          >
            <Mail className="h-4 w-4 mr-2" />
            Invitations
          </Button>
        </div>
      </div>

      {activeTab === "roster" ? (
        <>
          {/* Statistics Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Total Sessions
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs leading-tight">Total number of video</p>
                        <p className="text-xs leading-tight">analysis sessions completed</p>
                        <p className="text-xs leading-tight">across all your athletes</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">{stats.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  Across all athletes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Average Motion IQ
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs leading-tight">Team average of AI-powered</p>
                        <p className="text-xs leading-tight">performance scores combining</p>
                        <p className="text-xs leading-tight">technique, power, safety,</p>
                        <p className="text-xs leading-tight">artistry, and consistency</p>
                        <p className="text-xs leading-tight">metrics (0-100 scale)</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getIQColor(stats.avgMotionIQ)}`}>{stats.avgMotionIQ}</div>
                <p className="text-xs text-muted-foreground">
                  Team average
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Average ACL Risk
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs leading-tight">Team average of Anterior</p>
                        <p className="text-xs leading-tight">Cruciate Ligament injury</p>
                        <p className="text-xs leading-tight">risk assessment based on</p>
                        <p className="text-xs leading-tight">landing mechanics and</p>
                        <p className="text-xs leading-tight">joint angles (lower is better)</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">{stats.avgACLRisk}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.avgACLRisk < 15 ? 'Low risk' : 'Monitor closely'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  Completed Analyses
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs leading-tight">Number of video analyses</p>
                        <p className="text-xs leading-tight">that have been fully</p>
                        <p className="text-xs leading-tight">processed with results</p>
                        <p className="text-xs leading-tight">available across all athletes</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-400">{stats.completedAnalyses}</div>
                <p className="text-xs text-muted-foreground">
                  3 pending
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search athletes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 dark:hover:border-gray-500 bg-transparent text-gray-900 dark:text-white"
              />
            </div>
            <Button variant="outline" className="hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Athlete
            </Button>
          </div>

          {/* Athletes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAthletes.map((athlete) => (
              <Card 
                key={athlete.id} 
                className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 cursor-pointer transition-all hover:shadow-lg ${
                  selectedAthlete === athlete.id ? 'ring-2 ring-cyan-500' : ''
                }`}
                onClick={() => onAthleteChange(athlete.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{athlete.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{athlete.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Age</span>
                    <span className="text-sm text-gray-900 dark:text-white">{athlete.age} years</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
                    <Badge className={getLevelColor(athlete.level)}>
                      {athlete.level}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <Badge className={getStatusColor(athlete.status)}>
                      {athlete.status}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-cyan-500">{athlete.motionIQ}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Motion IQ</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-500">{athlete.sessions}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Sessions</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Improvement</span>
                    <span className="text-green-500 font-medium">{athlete.improvement}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Last Session</span>
                    <span className="text-gray-900 dark:text-white">{athlete.lastSession}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAthletes.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No athletes found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or add new athletes to your roster</p>
              <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Athlete
              </Button>
            </div>
          )}
        </>
      ) : (
        <InvitationManager user={user} />
      )}
    </div>
    </TooltipProvider>
  )
}
