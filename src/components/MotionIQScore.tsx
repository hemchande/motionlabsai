"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Brain, Trophy, Target, Shield, Zap, Star, TrendingUp, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface MotionIQProps {
  selectedAthlete: string
}

export default function MotionIQScore({ selectedAthlete }: MotionIQProps) {
  const [motionIQ, setMotionIQ] = useState(87)
  const [subScores, setSubScores] = useState({
    technique: 92,
    power: 84,
    safety: 89,
    artistry: 85,
    consistency: 88
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMotionIQ(prev => Math.max(70, Math.min(100, prev + (Math.random() - 0.5) * 2)))
      setSubScores(prev => ({
        technique: Math.max(70, Math.min(100, prev.technique + (Math.random() - 0.5) * 3)),
        power: Math.max(70, Math.min(100, prev.power + (Math.random() - 0.5) * 3)),
        safety: Math.max(70, Math.min(100, prev.safety + (Math.random() - 0.5) * 2)),
        artistry: Math.max(70, Math.min(100, prev.artistry + (Math.random() - 0.5) * 3)),
        consistency: Math.max(70, Math.min(100, prev.consistency + (Math.random() - 0.5) * 2))
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const getIQLevel = (score: number) => {
    if (score >= 95) return { level: "Elite", color: "text-cyan-400", bgColor: "bg-cyan-500/20" }
    if (score >= 85) return { level: "Advanced", color: "text-blue-400", bgColor: "bg-blue-500/20" }
    if (score >= 75) return { level: "Intermediate", color: "text-yellow-400", bgColor: "bg-yellow-500/20" }
    return { level: "Developing", color: "text-orange-400", bgColor: "bg-orange-500/20" }
  }

  const iqLevel = getIQLevel(motionIQ)

  const categories = [
    {
      name: "Technical Precision",
      score: subScores.technique,
      icon: Target,
      description: "Joint angles, body positioning, skill execution",
      color: "text-cyan-400"
    },
    {
      name: "Power Generation",
      score: subScores.power,
      icon: Zap,
      description: "Flight time, tumbling amplitude, explosive strength",
      color: "text-yellow-400"
    },
    {
      name: "Injury Prevention",
      score: subScores.safety,
      icon: Shield,
      description: "Landing stability, ACL risk, biomechanical safety",
      color: "text-emerald-400"
    },
    {
      name: "Artistry & Flow",
      score: subScores.artistry,
      icon: Star,
      description: "Movement smoothness, rhythm, aesthetic quality",
      color: "text-purple-400"
    },
    {
      name: "Consistency",
      score: subScores.consistency,
      icon: TrendingUp,
      description: "Performance reliability, skill repeatability",
      color: "text-blue-400"
    }
  ]

  return (
    <TooltipProvider>
      <div className="space-y-6">
      {/* Main Motion IQ Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/80 to-black/80 border-slate-800 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-cyan-400/5" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />

          <CardHeader className="text-center relative">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-cyan-500/25">
                <Brain className="h-8 w-8 text-black" />
              </div>
            </div>
            <CardTitle className="text-white text-2xl flex items-center justify-center">
              Motion IQ Score
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-slate-400 ml-2 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <div className="space-y-1">
                    <p className="text-xs leading-tight">AI-powered performance score</p>
                    <p className="text-xs leading-tight">combining technique, power,</p>
                    <p className="text-xs leading-tight">safety, artistry, and</p>
                    <p className="text-xs leading-tight">consistency metrics</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
            <CardDescription className="text-slate-400">
              AI-powered performance analysis for {selectedAthlete.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center relative">
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                className="text-6xl font-bold text-transparent bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text mb-2"
              >
                {Math.round(motionIQ)}
              </motion.div>
              <Badge className={`${iqLevel.bgColor} ${iqLevel.color} border-0 text-sm px-4 py-1`}>
                {iqLevel.level}
              </Badge>
            </div>

            {/* Circular Progress Ring */}
            <div className="relative w-48 h-48 mx-auto mb-6">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-700"
                />
                <motion.circle
                  cx="100"
                  cy="100"
                  r="80"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="transparent"
                  strokeLinecap="round"
                  strokeDasharray={502.4}
                  initial={{ strokeDashoffset: 502.4 }}
                  animate={{ strokeDashoffset: 502.4 - (motionIQ / 100) * 502.4 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="h-12 w-12 text-cyan-400" />
              </div>
            </div>

            <p className="text-slate-400 text-sm">
              Based on {categories.length} performance categories
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category, index) => (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300 group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg bg-slate-800 group-hover:scale-110 transition-transform`}>
                      <category.icon className={`h-4 w-4 ${category.color}`} />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm flex items-center">
                        {category.name}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-1">
                              <p className="text-xs leading-tight">{category.description}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${category.color}`}>
                      {Math.round(category.score)}
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500`}
                      initial={{ width: 0 }}
                      animate={{ width: `${category.score}%` }}
                      transition={{ delay: 0.2 * index, duration: 0.8 }}
                    />
                  </div>
                </div>

                <p className="text-slate-400 text-xs leading-relaxed">
                  {category.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Achievement Badges */}
      <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Trophy className="h-5 w-5 text-yellow-400 mr-2" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {motionIQ >= 90 && (
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                <Star className="h-3 w-3 mr-1" />
                Excellence in Motion
              </Badge>
            )}
            {subScores.safety >= 90 && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <Shield className="h-3 w-3 mr-1" />
                Safety Champion
              </Badge>
            )}
            {subScores.technique >= 90 && (
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                <Target className="h-3 w-3 mr-1" />
                Technical Master
              </Badge>
            )}
            {subScores.consistency >= 85 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <TrendingUp className="h-3 w-3 mr-1" />
                Consistency Pro
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    </TooltipProvider>
  )
}
