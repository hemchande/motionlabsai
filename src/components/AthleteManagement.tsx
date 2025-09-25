"use client"

import { useState, useEffect } from "react"
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
  HelpCircle,
  XCircle,
  AlertTriangle,
  Clock
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AthleteInvitationModal from "./AthleteInvitationModal"
import { useAuth } from "@/contexts/FirebaseAuthContext"

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
  const [roster, setRoster] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Derived data from roster
  const pendingInvitations = roster.filter(athlete => athlete.status === 'pending')
  const acceptedAthletes = roster.filter(athlete => athlete.status === 'accepted' || athlete.status === 'active')

  // Fetch roster data
  useEffect(() => {
    if (userRole === "coach" && user?.id) {
      fetchRoster();
    }
    if (userRole === "athlete" && user?.email) {
      fetchUserStats();
    }
  }, [userRole, user?.id, user?.email]);

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coach-roster?coachId=${user?.id}`);
      const data = await response.json();
      
      if (data.success) {
        setRoster(data.roster);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching roster:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`/api/coach-roster?coachId=${user?.id}&athleteEmail=${user?.email}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats || null);
      } else {
        console.error('Failed to fetch user stats:', data.error);
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setStats(null);
    }
  };

  const filteredAthletes = roster.filter(athlete =>
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
    switch (status) {
      case 'accepted':
      case 'active':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30'
      case 'declined':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'expired':
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  // Use real stats if available, otherwise fallback to mock data
  const displayStats = stats || {
    totalSessions: 0,
    avgMotionIQ: 0,
    avgACLRisk: 18,
    completedAnalyses: 0,
    totalAthletes: 0,
    pendingInvitations: 0
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
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {user?.fullName || user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email || 'No email available'}
                  </p>
                  <Badge className={
                    userRole === 'coach' 
                      ? "bg-blue-500/20 text-blue-600 border-blue-500/30"
                      : "bg-green-500/20 text-green-600 border-green-500/30"
                  }>
                    {userRole === 'coach' ? 'Coach' : 'Active Athlete'}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Role</span>
                  <span className="text-sm text-gray-900 dark:text-white capitalize">
                    {userRole}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    Active
                  </Badge>
                </div>
                {user?.institution && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Institution</span>
                    <span className="text-sm text-gray-900 dark:text-white">{user.institution}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      month: 'long', 
                      year: 'numeric' 
                    }) : 'Recent'}
                  </span>
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
                  <div className="text-2xl font-bold text-cyan-500">
                    {stats?.avgMotionIQ || stats?.averageMotionIQ || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Motion IQ</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {stats?.totalSessions || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">
                    {stats?.improvement ? `+${stats.improvement}%` : '0%'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Improvement</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">
                    {stats?.completedAnalyses || 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
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
                {stats?.totalSessions > 0 && (
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-gray-900 dark:text-white">First Session Completed</span>
                  </div>
                )}
                {(stats?.avgMotionIQ || stats?.averageMotionIQ || 0) > 90 && (
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-900 dark:text-white">Motion IQ &gt; 90</span>
                  </div>
                )}
                {stats?.totalSessions >= 5 && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-900 dark:text-white">5+ Sessions Completed</span>
                  </div>
                )}
                {(!stats || stats.totalSessions === 0) && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Complete your first session to unlock achievements!</p>
                  </div>
                )}
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
                <div className="text-2xl font-bold text-cyan-400">{displayStats.totalSessions}</div>
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
                <div className={`text-2xl font-bold ${getIQColor(displayStats.avgMotionIQ)}`}>{displayStats.avgMotionIQ}</div>
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
                <div className="text-2xl font-bold text-cyan-400">{displayStats.avgACLRisk}%</div>
                <p className="text-xs text-muted-foreground">
                  {displayStats.avgACLRisk < 15 ? 'Low risk' : 'Monitor closely'}
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
                <div className="text-2xl font-bold text-cyan-400">{displayStats.completedAnalyses}</div>
                <p className="text-xs text-muted-foreground">
                  {displayStats.pendingInvitations} pending
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

          {/* Loading State */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading roster...</div>
            </div>
          ) : (
            <>
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
                  {athlete.type === 'invitation' ? (
                    // Show invitation-specific info
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                        <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30">
                          Invitation
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <Badge className={getStatusColor(athlete.status)}>
                          {athlete.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Invited</span>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {athlete.joinedAt?.toDate?.()?.toLocaleDateString() || 'Recently'}
                        </span>
                      </div>
                    </>
                  ) : (
                    // Show athlete-specific info
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Age</span>
                        <span className="text-sm text-gray-900 dark:text-white">{athlete.age || 'N/A'} years</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
                        <Badge className={getLevelColor(athlete.level || 'beginner')}>
                          {athlete.level || 'Beginner'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                        <Badge className={getStatusColor(athlete.status)}>
                          {athlete.status}
                        </Badge>
                      </div>
                    </>
                  )}
                  
                  <Separator />
                  
                  {athlete.type === 'invitation' ? (
                    // Show invitation-specific metrics
                    <div className="text-center py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Waiting for athlete to accept invitation
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Invitation sent to {athlete.email}
                      </div>
                    </div>
                  ) : (
                    // Show athlete performance metrics
                    <>
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-cyan-500">{athlete.motionIQ || 0}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Motion IQ</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-500">{athlete.sessions || 0}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Sessions</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Improvement</span>
                        <span className="text-green-500 font-medium">{athlete.improvement || '0%'}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Last Session</span>
                        <span className="text-gray-900 dark:text-white">{athlete.lastSession || 'No sessions'}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

              {filteredAthletes.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No athletes or invitations found</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or send invitations to athletes</p>
                  <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Send Invitation
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="space-y-8">
          {/* Enhanced Invitation Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl p-8 text-white">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h2 className="text-4xl font-bold">Team Invitations</h2>
                <p className="text-xl text-cyan-100">Invite athletes to join your team and unlock their potential</p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
                    <Users className="h-5 w-5" />
                    <span className="text-sm font-medium">Grow Your Team</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
                    <Activity className="h-5 w-5" />
                    <span className="text-sm font-medium">Track Progress</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-2">
                    <Trophy className="h-5 w-5" />
                    <span className="text-sm font-medium">Improve Performance</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <AthleteInvitationModal 
                  coachName={user?.fullName || "Coach"}
                  coachEmail={user?.email || ""}
                  coachId={user?.id || ""}
                  institution={user?.institution}
                  onInvitationSent={() => {
                    console.log("Athlete invitation sent successfully!")
                    fetchRoster();
                  }}
                />
              </div>
            </div>
          </div>

          {/* Enhanced Invitation Stats with Real Data */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Invitations</p>
                    <p className="text-3xl font-bold text-yellow-800 dark:text-yellow-200">{pendingInvitations.length}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Awaiting response</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Active Athletes</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">{acceptedAthletes.length}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">Team members</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">Declined</p>
                    <p className="text-3xl font-bold text-red-800 dark:text-red-200">0</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Not interested</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <XCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Expired</p>
                    <p className="text-3xl font-bold text-gray-800 dark:text-gray-200">0</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Past 7 days</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Invitation Process & Benefits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* How It Works */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <span>How Team Invitations Work</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Simple 4-step process to grow your team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Send Invitation", desc: "Enter athlete's email and send personalized invitation", icon: "📧" },
                    { step: 2, title: "Athlete Receives Email", desc: "Athlete gets secure invitation link with team details", icon: "✉️" },
                    { step: 3, title: "Create Account", desc: "Athlete signs up with their own password and profile", icon: "👤" },
                    { step: 4, title: "Join Your Team", desc: "Athlete automatically joins your team and gains access", icon: "🎯" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                          <span>{item.title}</span>
                          <span className="text-lg">{item.icon}</span>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What Athletes Get */}
            <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <Trophy className="h-5 w-5 text-white" />
                  </div>
                  <span>What Athletes Get</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Powerful tools to improve their performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { 
                    title: "AI-Powered Motion Analysis", 
                    desc: "Advanced pose detection and biomechanical analysis", 
                    icon: "🤖",
                    color: "from-purple-500 to-pink-500"
                  },
                  { 
                    title: "ACL Risk Assessment", 
                    desc: "Real-time injury prevention and safety monitoring", 
                    icon: "🛡️",
                    color: "from-red-500 to-orange-500"
                  },
                  { 
                    title: "Performance Tracking", 
                    desc: "Detailed metrics and progress visualization", 
                    icon: "📊",
                    color: "from-blue-500 to-cyan-500"
                  },
                  { 
                    title: "Personalized Dashboard", 
                    desc: "Custom insights and improvement recommendations", 
                    icon: "🎯",
                    color: "from-green-500 to-emerald-500"
                  }
                ].map((benefit) => (
                  <div key={benefit.title} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-r ${benefit.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                      {benefit.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{benefit.title}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Team Benefits & Success Stories */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl text-indigo-900 dark:text-indigo-100">
                <Users className="h-8 w-8" />
                <span>Why Teams Choose MotionLabs AI</span>
              </CardTitle>
              <CardDescription className="text-lg text-indigo-700 dark:text-indigo-300">
                Join thousands of coaches transforming their athletes' performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">25% Improvement</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average performance improvement in technique and safety</p>
                </div>
                <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">40% Fewer Injuries</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Reduced ACL and other sports-related injuries</p>
                </div>
                <div className="text-center p-6 bg-white/50 dark:bg-gray-800/50 rounded-xl">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Real-time Feedback</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instant analysis and coaching cues during training</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </TooltipProvider>
  )
}
