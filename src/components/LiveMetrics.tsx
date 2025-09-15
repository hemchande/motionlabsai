"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Trophy, Clock, Target, Zap } from "lucide-react"
import { motion } from "framer-motion"

interface LiveMetricsProps {
  selectedAthlete: string
  activeEvent: string
}

export default function LiveMetrics({ selectedAthlete, activeEvent }: LiveMetricsProps) {
  const [metrics, setMetrics] = useState({
    currentScore: 14.85,
    difficulty: 6.2,
    execution: 8.65,
    deductions: 0.15,
    position: 1,
    totalAthletes: 24,
    avgLandingAccuracy: 94.2,
    routineTime: 89.3,
    heartRate: 142,
    energy: 87,
    motionIQ: 94
  })

  // Simulate live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        currentScore: prev.currentScore + (Math.random() - 0.5) * 0.1,
        execution: prev.execution + (Math.random() - 0.5) * 0.05,
        deductions: Math.max(0, prev.deductions + (Math.random() - 0.7) * 0.05),
        avgLandingAccuracy: prev.avgLandingAccuracy + (Math.random() - 0.5) * 2,
        heartRate: prev.heartRate + (Math.random() - 0.5) * 10,
        energy: Math.max(60, Math.min(100, prev.energy + (Math.random() - 0.5) * 5)),
        motionIQ: Math.max(70, Math.min(100, prev.motionIQ + (Math.random() - 0.5) * 3))
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const metricCards = [
    {
      title: "Motion IQ Score",
      value: Math.round(metrics.motionIQ),
      description: "AI-powered performance rating",
      icon: Trophy,
      trend: metrics.motionIQ > 90 ? "up" : "down",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10"
    },
    {
      title: "Current Score",
      value: metrics.currentScore.toFixed(2),
      description: "Live competition score",
      icon: Target,
      trend: metrics.currentScore > 14.8 ? "up" : "down",
      color: "text-white",
      bgColor: "bg-slate-800/50"
    },
    {
      title: "Difficulty Score",
      value: metrics.difficulty.toFixed(1),
      description: "D-Score rating",
      icon: Target,
      trend: "stable",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    {
      title: "Execution Score",
      value: metrics.execution.toFixed(2),
      description: "E-Score rating",
      icon: Zap,
      trend: metrics.execution > 8.6 ? "up" : "down",
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    {
      title: "Deductions",
      value: metrics.deductions.toFixed(2),
      description: "Total penalties",
      icon: TrendingDown,
      trend: metrics.deductions < 0.2 ? "up" : "down",
      color: "text-red-400",
      bgColor: "bg-red-500/10"
    },
    {
      title: "Landing Accuracy",
      value: `${metrics.avgLandingAccuracy.toFixed(1)}%`,
      description: "Average precision",
      icon: Target,
      trend: metrics.avgLandingAccuracy > 93 ? "up" : "down",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10"
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Live Performance Metrics</h2>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-white border-slate-700">
            {selectedAthlete.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          <Badge variant="outline" className="text-white border-slate-700">
            {activeEvent.charAt(0).toUpperCase() + activeEvent.slice(1)}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <metric.icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className={`text-2xl font-bold ${metric.color === "text-white" ? "text-white" : metric.color}`}>
                    {metric.value}
                  </div>
                  {metric.trend === "up" && (
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                  )}
                  {metric.trend === "down" && (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Real-time Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              <span>Routine Timing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {metrics.routineTime.toFixed(1)}s
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(metrics.routineTime / 90) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Target: 90s</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              <span>Energy Level</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white mb-2">
              {Math.round(metrics.energy)}%
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.energy}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-2">Heart Rate: {Math.round(metrics.heartRate)} BPM</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
