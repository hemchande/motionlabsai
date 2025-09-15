"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { TrendingUp, BarChart3, Activity, Target } from "lucide-react"

interface PerformanceChartsProps {
  selectedAthlete: string
  detailed?: boolean
}

export default function PerformanceCharts({ selectedAthlete, detailed = false }: PerformanceChartsProps) {
  const [timeRange, setTimeRange] = useState("7d")

  // Mock performance data
  const scoreHistory = [
    { date: "2024-01-15", score: 14.2, difficulty: 6.0, execution: 8.4 },
    { date: "2024-01-22", score: 14.5, difficulty: 6.1, execution: 8.6 },
    { date: "2024-01-29", score: 14.8, difficulty: 6.2, execution: 8.8 },
    { date: "2024-02-05", score: 14.3, difficulty: 6.0, execution: 8.5 },
    { date: "2024-02-12", score: 14.9, difficulty: 6.3, execution: 8.9 },
    { date: "2024-02-19", score: 15.1, difficulty: 6.4, execution: 9.0 },
    { date: "2024-02-26", score: 14.85, difficulty: 6.2, execution: 8.65 }
  ]

  const eventBreakdown = [
    { event: "Floor", score: 14.85, difficulty: 6.2, execution: 8.65 },
    { event: "Vault", score: 15.2, difficulty: 6.5, execution: 8.7 },
    { event: "Beam", score: 14.1, difficulty: 5.8, execution: 8.3 },
    { event: "Bars", score: 14.6, difficulty: 6.1, execution: 8.5 }
  ]

  const skillAnalysis = [
    { skill: "Tumbling", current: 95, target: 98, improvement: 5 },
    { skill: "Form", current: 88, target: 92, improvement: 8 },
    { skill: "Landing", current: 94, target: 96, improvement: 3 },
    { skill: "Rhythm", current: 91, target: 94, improvement: 6 },
    { skill: "Difficulty", current: 86, target: 90, improvement: 12 },
    { skill: "Consistency", current: 93, target: 95, improvement: 4 }
  ]

  const performanceRadar = [
    { subject: "Power", A: 94, B: 85, fullMark: 100 },
    { subject: "Flexibility", A: 96, B: 88, fullMark: 100 },
    { subject: "Balance", A: 89, B: 92, fullMark: 100 },
    { subject: "Coordination", A: 92, B: 86, fullMark: 100 },
    { subject: "Strength", A: 88, B: 90, fullMark: 100 },
    { subject: "Precision", A: 95, B: 87, fullMark: 100 }
  ]

  const compactView = (
    <div className="grid grid-cols-1 gap-6">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <span>Score Progression</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
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
                dataKey="score"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )

  const detailedView = (
    <Tabs defaultValue="trends" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-600">
        <TabsTrigger value="trends" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
          Trends
        </TabsTrigger>
        <TabsTrigger value="events" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
          Events
        </TabsTrigger>
        <TabsTrigger value="skills" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
          Skills
        </TabsTrigger>
        <TabsTrigger value="radar" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
          Performance
        </TabsTrigger>
      </TabsList>

      <TabsContent value="trends" className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Score Progression Over Time</CardTitle>
            <CardDescription className="text-slate-400">
              Detailed breakdown of performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="score"
                  stackId="1"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.6}
                  name="Total Score"
                />
                <Area
                  type="monotone"
                  dataKey="difficulty"
                  stackId="2"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.6}
                  name="Difficulty"
                />
                <Area
                  type="monotone"
                  dataKey="execution"
                  stackId="3"
                  stroke="#8B5CF6"
                  fill="#8B5CF6"
                  fillOpacity={0.6}
                  name="Execution"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="events" className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Event Performance Breakdown</CardTitle>
            <CardDescription className="text-slate-400">
              Comparative analysis across different events
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
                <Legend />
                <Bar dataKey="difficulty" fill="#3B82F6" name="Difficulty Score" />
                <Bar dataKey="execution" fill="#8B5CF6" name="Execution Score" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="skills" className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Skill Development Analysis</CardTitle>
            <CardDescription className="text-slate-400">
              Individual skill progression and improvement areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {skillAnalysis.map((skill, index) => (
                <div key={skill.skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-medium">{skill.skill}</span>
                    <span className="text-slate-400 text-sm">
                      {skill.current}% / {skill.target}%
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-slate-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${skill.current}%` }}
                      />
                      <div
                        className="absolute top-0 w-1 h-3 bg-yellow-400 rounded-full"
                        style={{ left: `${skill.target}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Current: {skill.current}%</span>
                    <span>+{skill.improvement}% improvement needed</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="radar" className="space-y-6">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Performance Radar</CardTitle>
            <CardDescription className="text-slate-400">
              Multi-dimensional performance analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={performanceRadar}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#9CA3AF', fontSize: 10 }}
                />
                <Radar
                  name="Current Performance"
                  dataKey="A"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Average Competitor"
                  dataKey="B"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )

  return detailed ? detailedView : compactView
}
