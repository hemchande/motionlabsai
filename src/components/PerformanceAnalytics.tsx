"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { TrendingUp, Brain, Target, Shield, Clock } from "lucide-react"
import { motion } from "framer-motion"
import MotionIQScore from "./MotionIQScore"
import BiomechanicalMetrics from "./BiomechanicalMetrics"

interface PerformanceAnalyticsProps {
  selectedAthlete: string
  onAthleteChange: (athlete: string) => void
}

export default function PerformanceAnalytics({ selectedAthlete, onAthleteChange }: PerformanceAnalyticsProps) {
  const [timeRange, setTimeRange] = useState("30d")
  const [activeView, setActiveView] = useState("overview")

  const scoreHistory = [
    { date: "Jan 15", motionIQ: 89, traditionalScore: 14.2, aclRisk: 12 },
    { date: "Jan 22", motionIQ: 91, traditionalScore: 14.5, aclRisk: 10 },
    { date: "Jan 29", motionIQ: 93, traditionalScore: 14.8, aclRisk: 8 },
    { date: "Feb 05", motionIQ: 90, traditionalScore: 14.3, aclRisk: 11 },
    { date: "Feb 12", motionIQ: 94, traditionalScore: 14.9, aclRisk: 7 },
    { date: "Feb 19", motionIQ: 96, traditionalScore: 15.1, aclRisk: 6 },
    { date: "Feb 26", motionIQ: 94, traditionalScore: 14.85, aclRisk: 8 }
  ]

  const eventBreakdown = [
    { event: "Floor", motionIQ: 94, score: 14.85, sessions: 12 },
    { event: "Vault", motionIQ: 92, score: 15.2, sessions: 8 },
    { event: "Beam", motionIQ: 88, score: 14.1, sessions: 10 },
    { event: "Bars", motionIQ: 90, score: 14.6, sessions: 9 }
  ]

  const athletes = [
    { id: "athlete-1", name: "Simone Biles" },
    { id: "athlete-2", name: "Katelyn Ohashi" },
    { id: "athlete-3", name: "Nadia Comaneci" },
    { id: "athlete-4", name: "Shannon Miller" }
  ]

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Performance Analytics</h1>
            <p className="text-slate-400">Detailed insights and progress tracking</p>
          </div>

          <div className="flex items-center space-x-4">
            <Select value={selectedAthlete} onValueChange={onAthleteChange}>
              <SelectTrigger className="w-48 bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {athletes.map(athlete => (
                  <SelectItem key={athlete.id} value={athlete.id}>
                    {athlete.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 bg-slate-900 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeView === "overview" && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <TrendingUp className="h-5 w-5 text-emerald-400 mr-2" />
                    Motion IQ Progress
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    AI-powered performance tracking over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={scoreHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="motionIQ"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                        name="Motion IQ"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Shield className="h-5 w-5 text-emerald-400 mr-2" />
                    Injury Risk Tracking
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    ACL risk assessment over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={scoreHistory}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="aclRisk"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                        name="ACL Risk %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Event Performance */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Event Performance Breakdown</CardTitle>
                <CardDescription className="text-slate-400">
                  Motion IQ scores across different events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={eventBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="event" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="motionIQ" fill="#06b6d4" name="Motion IQ" />
                    <Bar dataKey="sessions" fill="#8b5cf6" name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Motion IQ Score */}
            <MotionIQScore selectedAthlete={selectedAthlete} />

            {/* Biomechanical Data */}
            <BiomechanicalMetrics selectedAthlete={selectedAthlete} />
          </div>
        )}
      </div>
    </div>
  )
}
