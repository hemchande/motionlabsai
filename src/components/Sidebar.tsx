"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Video,
  BarChart3,
  Users,
  // Share2, // COMMENTED OUT FOR NOW - Share & Export functionality
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  // Sun, // COMMENTED OUT FOR NOW - Theme toggle functionality
  // Moon, // COMMENTED OUT FOR NOW - Theme toggle functionality
  User,
  Home,
  Calendar,
  Activity,
  FileVideo
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Logo from "./Logo"
// COMMENTED OUT FOR NOW - Theme toggle functionality
// import { useTheme } from "@/contexts/ThemeContext"
import Link from "next/link"
import { usePathname } from "next/navigation"
import LogoutConfirmation from "./LogoutConfirmation"

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

interface SidebarProps {
  activeView: string
  setActiveView: (view: string) => void
  userRole: "coach" | "athlete"
  onLogout: () => void
  user: User | null
  stats?: {
    totalSessions: number;
    avgMotionIQ: number;
    avgACLRisk: number;
    avgPrecision?: number;
    avgPower?: number;
    improvement?: number;
  }
}

export default function Sidebar({ activeView, setActiveView, userRole, onLogout, user, stats }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  // COMMENTED OUT FOR NOW - Theme toggle functionality
  // const { theme, toggleTheme } = useTheme()
  const pathname = usePathname()

  const mainMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      description: userRole === "coach" ? "Overview & athlete management" : "My performance overview",
      category: "main"
    },
    // {
    //   id: "video-analysis",
    //   label: "Video Analysis",
    //   icon: Video,
    //   description: "AI-powered motion analysis",
    //   category: "main"
    // },
    {
      id: "performance-analytics",
      label: "Performance Analytics",
      icon: BarChart3,
      description: "Detailed metrics & insights",
      category: "main"
    },
    {
      id: "athletes",
      label: userRole === "coach" ? "My Athletes" : "My Profile",
      icon: Users,
      description: userRole === "coach" ? "Manage athlete profiles" : "View your performance",
      category: "main"
    }
  ]

  const additionalMenuItems = []

  const coachOnlyMenuItems = [
    // Only show Session History to coaches
    ...(userRole === "coach" ? [{
      id: "sessions",
      label: "Session History",
      icon: Calendar,
      description: "View previous analysis sessions"
    }] : [])
  ]

  // COMMENTED OUT FOR NOW - Share & Export functionality
  // const coachTools = [
  //   {
  //     id: "share-export",
  //     label: "Share & Export",
  //     icon: Share2,
  //     description: "Share clips and reports"
  //   }
  // ]
  const coachTools = []

  const highlights = [
    { 
      label: "Avg Motion IQ", 
      value: stats?.avgMotionIQ?.toString() || "0", 
      color: "text-cyan-400" 
    },
    { 
      label: "Sessions", 
      value: stats?.totalSessions?.toString() || "0", 
      color: "text-white" 
    },
    { 
      label: "Improvement", 
      value: stats?.improvement ? `+${stats.improvement}%` : "+0%", 
      color: "text-emerald-400" 
    }
  ]

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="ml-nav border-r ml-border h-screen flex flex-col flex-shrink-0"
    >
      {/* Header */}
      <div className="p-4 border-b ml-border">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <Logo size="sm" />
                <div>
                  <h1 className="font-bold ml-text-hi text-sm">MotionLabs AI</h1>
                  <p className="text-xs ml-text-lo">Advanced Analytics</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="ml-text-lo hover:ml-text-hi p-1"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Badge className="mt-3 bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                {userRole === "coach" ? "Coach Account" : "Athlete Account"}
              </Badge>
              
              {/* User Info */}
              {user && (
                <div className="mt-3 p-3 ml-card rounded-lg border ml-border">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 ml-text-lo" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium ml-text-hi truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs ml-text-lo truncate">
                        {user.email}
                      </p>
                      {user.institution && (
                        <p className="text-xs ml-text-lo truncate">
                          {user.institution}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="p-4">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold ml-text-lo uppercase tracking-wider mb-3"
              >
                MAIN
              </motion.h2>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            {mainMenuItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start h-auto p-3 ${
                  activeView === item.id
                    ? "ml-cyan-bg text-black hover:ml-cyan-hover"
                    : "ml-text-md hover:ml-text-hi hover:ml-hover"
                }`}
                onClick={() => setActiveView(item.id)}
              >
                <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="text-left"
                    >
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            ))}
          </div>
        </div>

        {/* Coach-Only Navigation */}
        {userRole === "coach" && coachOnlyMenuItems.length > 0 && (
          <div className="p-4 border-t ml-border">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold ml-text-lo uppercase tracking-wider mb-3"
                >
                  COACH FEATURES
                </motion.h2>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {coachOnlyMenuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-auto p-3 ${
                    activeView === item.id
                      ? "ml-cyan-bg text-black hover:ml-cyan-hover"
                      : "ml-text-md hover:ml-text-hi hover:ml-hover"
                  }`}
                  onClick={() => setActiveView(item.id)}
                >
                  <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-left"
                      >
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Additional Navigation */}
        <div className="p-4 border-t ml-border">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-semibold ml-text-lo uppercase tracking-wider mb-3"
              >
                ADDITIONAL
              </motion.h2>
            )}
          </AnimatePresence>

          <div className="space-y-1">
            {additionalMenuItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <div
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors cursor-pointer group ${
                    isActive(item.href)
                      ? 'ml-cyan-bg text-black'
                      : 'ml-text-md hover:ml-text-hi hover:ml-hover'
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-left"
                      >
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Coach Tools */}
        {userRole === "coach" && (
          <div className="p-4 border-t ml-border">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold ml-text-lo uppercase tracking-wider mb-3"
                >
                  COACH TOOLS
                </motion.h2>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {coachTools.map((item) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={`w-full justify-start h-auto p-3 ${
                    activeView === item.id
                      ? "ml-cyan-bg text-black hover:ml-cyan-hover"
                      : "ml-text-md hover:ml-text-hi hover:ml-hover"
                  }`}
                  onClick={() => setActiveView(item.id)}
                >
                  <item.icon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="text-left"
                      >
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Today's Highlights */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 m-4 ml-card rounded-lg border ml-border"
            >
              <h3 className="text-sm font-semibold ml-text-hi mb-3">Today's Highlights</h3>
              <div className="space-y-3">
                {highlights.map((highlight, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs ml-text-md">{highlight.label}</span>
                    <span className={`text-sm font-bold ${highlight.color}`}>
                      {highlight.value}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t ml-border space-y-2">
        {/* Theme Toggle - COMMENTED OUT FOR NOW */}
        {/* <Button
          variant="ghost"
          className={`w-full justify-start h-auto p-3 ml-text-md hover:ml-text-hi hover:ml-hover`}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <Sun className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
          ) : (
            <Moon className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
          )}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-left"
              >
                <div className="font-medium text-sm">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </div>
                <div className="text-xs opacity-70">Switch theme</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Button> */}

        {/* Settings */}
        <Button
          variant="ghost"
          className={`w-full justify-start h-auto p-3 ${
            activeView === "settings"
              ? "ml-cyan-bg text-black hover:ml-cyan-hover"
              : "ml-text-md hover:ml-text-hi hover:ml-hover"
          }`}
          onClick={() => setActiveView("settings")}
        >
          <Settings className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-left"
              >
                <div className="font-medium text-sm">Settings</div>
                <div className="text-xs opacity-70">App preferences</div>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>

        {/* Sign Out */}
        <LogoutConfirmation onLogout={onLogout}>
          <Button
            variant="ghost"
            className={`w-full justify-start h-auto p-3 ml-text-md hover:text-red-400 hover:ml-hover`}
          >
            <LogOut className={`h-4 w-4 ${isCollapsed ? "mx-auto" : "mr-3"}`} />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="text-left"
                >
                  <div className="font-medium text-sm">Sign Out</div>
                  <div className="text-xs opacity-70">End session</div>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </LogoutConfirmation>
      </div>
    </motion.div>
  )
}
