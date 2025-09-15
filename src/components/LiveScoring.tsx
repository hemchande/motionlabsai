"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Clock, Users, Star, TrendingUp, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"

interface LiveScoringProps {
  activeEvent: string
}

export default function LiveScoring({ activeEvent }: LiveScoringProps) {
  const [currentRotation, setCurrentRotation] = useState(2)
  const [timeRemaining, setTimeRemaining] = useState(1245)

  // Mock live competition data
  const athletes = [
    {
      id: 1,
      name: "Simone Biles",
      country: "USA",
      currentScore: 15.125,
      difficulty: 6.4,
      execution: 8.725,
      deductions: 0.0,
      status: "competing",
      rotation: 2,
      position: 1
    },
    {
      id: 2,
      name: "Katelyn Ohashi",
      country: "USA",
      currentScore: 14.850,
      difficulty: 6.2,
      execution: 8.650,
      deductions: 0.0,
      status: "warmup",
      rotation: 2,
      position: 2
    },
    {
      id: 3,
      name: "Nadia Comaneci",
      country: "ROM",
      currentScore: 14.725,
      difficulty: 6.0,
      execution: 8.725,
      deductions: 0.0,
      status: "complete",
      rotation: 2,
      position: 3
    },
    {
      id: 4,
      name: "Shannon Miller",
      country: "USA",
      currentScore: 14.600,
      difficulty: 5.9,
      execution: 8.700,
      deductions: 0.0,
      status: "complete",
      rotation: 2,
      position: 4
    }
  ]

  const judgeScores = [
    { judge: "E1", score: 8.8, deductions: 0.1 },
    { judge: "E2", score: 8.9, deductions: 0.0 },
    { judge: "E3", score: 8.7, deductions: 0.2 },
    { judge: "E4", score: 8.8, deductions: 0.1 },
    { judge: "D1", score: 6.4, deductions: 0.0 },
    { judge: "D2", score: 6.3, deductions: 0.0 }
  ]

  const rotationSchedule = [
    { rotation: 1, event: "Vault", time: "14:00", status: "complete" },
    { rotation: 2, event: "Uneven Bars", time: "14:30", status: "active" },
    { rotation: 3, event: "Balance Beam", time: "15:00", status: "upcoming" },
    { rotation: 4, event: "Floor Exercise", time: "15:30", status: "upcoming" }
  ]

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "competing": return "bg-emerald-500"
      case "warmup": return "bg-yellow-500"
      case "complete": return "bg-slate-500"
      default: return "bg-slate-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "competing": return "COMPETING"
      case "warmup": return "WARM-UP"
      case "complete": return "COMPLETE"
      default: return "WAITING"
    }
  }

  return (
    <div className="space-y-6">
      {/* Competition Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8 text-yellow-400" />
              <div>
                <p className="text-slate-400 text-sm">Current Event</p>
                <p className="text-white text-xl font-bold">
                  {activeEvent.charAt(0).toUpperCase() + activeEvent.slice(1)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-slate-400 text-sm">Time Remaining</p>
                <p className="text-white text-xl font-bold">
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-slate-400 text-sm">Rotation</p>
                <p className="text-white text-xl font-bold">
                  {currentRotation} / 4
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Star className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-slate-400 text-sm">Leading Score</p>
                <p className="text-white text-xl font-bold">
                  {Math.max(...athletes.map(a => a.currentScore)).toFixed(3)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-600">
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
            Live Leaderboard
          </TabsTrigger>
          <TabsTrigger value="judging" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
            Judge Scores
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
            Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Live Competition Standings</CardTitle>
              <CardDescription className="text-slate-400">
                Real-time athlete rankings and scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {athletes.map((athlete, index) => (
                  <motion.div
                    key={athlete.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border transition-all ${
                      athlete.status === "competing"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-600 bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl font-bold text-white w-8">
                          {athlete.position}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{athlete.name}</h3>
                          <p className="text-slate-400 text-sm">{athlete.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge className={`${getStatusColor(athlete.status)} text-white`}>
                          {getStatusText(athlete.status)}
                        </Badge>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-white">
                            {athlete.currentScore.toFixed(3)}
                          </p>
                          <p className="text-slate-400 text-sm">Total Score</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Difficulty</p>
                        <p className="text-blue-400 font-semibold">{athlete.difficulty}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Execution</p>
                        <p className="text-purple-400 font-semibold">{athlete.execution}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Deductions</p>
                        <p className="text-red-400 font-semibold">-{athlete.deductions}</p>
                      </div>
                    </div>

                    {athlete.status === "competing" && (
                      <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300 animate-pulse"
                          style={{ width: "65%" }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judging" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Judge Panel Scores</CardTitle>
              <CardDescription className="text-slate-400">
                Individual judge evaluations and deductions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white font-semibold mb-4">Execution Judges</h3>
                  <div className="space-y-3">
                    {judgeScores.filter(j => j.judge.startsWith('E')).map((judge, index) => (
                      <div key={judge.judge} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-purple-400 border-purple-400">
                            {judge.judge}
                          </Badge>
                          <span className="text-white">Judge {index + 1}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{judge.score}</p>
                          {judge.deductions > 0 && (
                            <p className="text-red-400 text-sm">-{judge.deductions}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-4">Difficulty Judges</h3>
                  <div className="space-y-3">
                    {judgeScores.filter(j => j.judge.startsWith('D')).map((judge, index) => (
                      <div key={judge.judge} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="text-blue-400 border-blue-400">
                            {judge.judge}
                          </Badge>
                          <span className="text-white">Judge {index + 1}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{judge.score}</p>
                          {judge.deductions > 0 && (
                            <p className="text-red-400 text-sm">-{judge.deductions}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Final Score Calculation</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-400">Difficulty Average</p>
                    <p className="text-blue-400 font-semibold">6.35</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Execution Average</p>
                    <p className="text-purple-400 font-semibold">8.775</p>
                  </div>
                  <div>
                    <p className="text-slate-400">Total Score</p>
                    <p className="text-emerald-400 font-bold text-lg">15.125</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Competition Schedule</CardTitle>
              <CardDescription className="text-slate-400">
                Rotation timeline and event progression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rotationSchedule.map((rotation, index) => (
                  <div
                    key={rotation.rotation}
                    className={`p-4 rounded-lg border transition-all ${
                      rotation.status === "active"
                        ? "border-emerald-500 bg-emerald-500/10"
                        : rotation.status === "complete"
                        ? "border-slate-600 bg-slate-700/30"
                        : "border-slate-600 bg-slate-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-xl font-bold text-white w-8">
                          {rotation.rotation}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{rotation.event}</h3>
                          <p className="text-slate-400 text-sm">Scheduled: {rotation.time}</p>
                        </div>
                      </div>
                      <Badge
                        className={
                          rotation.status === "active"
                            ? "bg-emerald-500 text-white"
                            : rotation.status === "complete"
                            ? "bg-slate-500 text-white"
                            : "bg-yellow-500 text-white"
                        }
                      >
                        {rotation.status.toUpperCase()}
                      </Badge>
                    </div>

                    {rotation.status === "active" && (
                      <div className="mt-3 w-full bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: "60%" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
