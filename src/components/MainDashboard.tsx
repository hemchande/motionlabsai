"use client"

import { useState, useCallback } from "react"
import Sidebar from "./Sidebar"
import VideoAnalysisMain from "./VideoAnalysisMain"
import PerformanceAnalytics from "./PerformanceAnalytics"
import AthleteManagement from "./AthleteManagement"
import UploadCenter from "./UploadCenter"
// COMMENTED OUT FOR NOW - Share & Export functionality
// import ShareExport from "./ShareExport"
import Settings from "./Settings"
import CoachDashboard from "./CoachDashboard"
import AthleteDashboard from "./AthleteDashboard"
import SessionDashboard from "./SessionDashboard"
import RevertChanges from "./RevertChanges"

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

interface UploadedVideo {
  id: string
  name: string
  file: File
  url: string
  athlete: string
  event: string
  session: string
  notes: string
  uploadDate: string
  duration?: string
  size: number
  status: string
  motionIQ?: number
}

interface MainDashboardProps {
  userRole: "coach" | "athlete"
  onLogout: () => void
  user: User | null
}

export default function MainDashboard({ userRole, onLogout, user }: MainDashboardProps) {
  const [activeView, setActiveView] = useState("dashboard")
  const [dashboardStats, setDashboardStats] = useState<{
    totalSessions: number;
    avgMotionIQ: number;
    avgACLRisk: number;
    avgPrecision?: number;
    avgPower?: number;
    improvement?: number;
  }>({
    totalSessions: 0,
    avgMotionIQ: 0,
    avgACLRisk: 0,
    avgPrecision: 0,
    avgPower: 0,
    improvement: 0
  })
  const [selectedAthlete, setSelectedAthlete] = useState("athlete-1")
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<UploadedVideo | null>(null)

  // Memoize the stats update function to prevent infinite loops
  const handleStatsUpdate = useCallback((stats: {
    totalSessions: number;
    avgMotionIQ: number;
    avgACLRisk: number;
    avgPrecision?: number;
    avgPower?: number;
    improvement?: number;
  }) => {
    setDashboardStats(stats)
  }, [])

  const handleVideoUpload = (video: UploadedVideo) => {
    setUploadedVideos(prev => [...prev, video])
    // Automatically select the newly uploaded video and switch to video analysis
    setSelectedVideo(video)
    setActiveView("video-analysis")
  }

  const renderMainContent = () => {
    switch (activeView) {
      case "dashboard":
        return userRole === "coach" ? (
          <CoachDashboard user={user} onStatsUpdate={handleStatsUpdate} />
        ) : (
          <AthleteDashboard user={user} onStatsUpdate={handleStatsUpdate} />
        )
      case "video-analysis":
        return (
          <VideoAnalysisMain
            selectedAthlete={selectedAthlete}
            onAthleteChange={setSelectedAthlete}
            userRole={userRole}
            uploadedVideos={uploadedVideos}
            selectedVideo={selectedVideo}
            onVideoSelect={setSelectedVideo}
            onNavigateToUpload={() => setActiveView("upload")}
          />
        )
      case "performance-analytics":
        return (
          <PerformanceAnalytics
            selectedAthlete={selectedAthlete}
            onAthleteChange={setSelectedAthlete}
          />
        )
      case "athletes":
        return (
          <AthleteManagement
            userRole={userRole}
            selectedAthlete={selectedAthlete}
            onAthleteChange={setSelectedAthlete}
            user={user}
          />
        )
      case "upload":
        return userRole === "coach" ? (
          <UploadCenter
            onVideoUpload={handleVideoUpload}
            uploadedVideos={uploadedVideos}
          />
        ) : null
      // COMMENTED OUT FOR NOW - Share & Export functionality
      // case "share-export":
      //   return userRole === "coach" ? <ShareExport /> : null
      case "sessions":
        return userRole === "coach" ? (
          <SessionDashboard onNavigateToUpload={() => setActiveView("upload")} />
        ) : null
      case "settings":
        return <Settings userRole={userRole} user={user} />
      case "revert":
        return userRole === "coach" ? (
          <RevertChanges 
            onRevert={(changeId) => {
              console.log(`Reverting change: ${changeId}`)
              // In a real implementation, this would actually revert the changes
            }}
            onRestore={(changeId) => {
              console.log(`Restoring change: ${changeId}`)
              // In a real implementation, this would actually restore the changes
            }}
          />
        ) : null
      default:
        return userRole === "coach" ? (
          <CoachDashboard user={user} onStatsUpdate={handleStatsUpdate} />
        ) : (
          <AthleteDashboard user={user} onStatsUpdate={handleStatsUpdate} />
        )
    }
  }

  return (
    <div className="h-screen ml-bg flex min-w-0">
      {/* Sidebar */}
      <div className="flex-shrink-0">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          userRole={userRole}
          onLogout={onLogout}
          user={user}
          stats={dashboardStats}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-2 min-w-0">
        {renderMainContent()}
      </div>
    </div>
  )
}
