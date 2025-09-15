"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Users, Trophy, TrendingUp, Target, Zap, Award } from "lucide-react"
import { motion } from "framer-motion"

interface AthleteComparisonProps {
  activeEvent: string
}

export default function AthleteComparison({ activeEvent }: AthleteComparisonProps) {
  const [selectedAthletes, setSelectedAthletes] = useState(["athlete-1", "athlete-2"])
  const [comparisonType, setComparisonType] = useState("current")

  const athletes = {
    "athlete-1": {
      name: "Simone Biles",
      country: "USA",
      scores: {
        vault: 15.2,
        bars: 14.6,
        beam: 14.1,
        floor: 14.85
      },
      breakdown: {
        difficulty: 6.2,
        execution: 8.65,
        deductions: 0.0
      },
      career: {
        competitions: 45,
        medals: 32,
        avgScore: 14.8
      }
    },
    "athlete-2": {
      name: "Katelyn Ohashi",
      country: "USA",
      scores: {
        vault: 14.8,
        bars: 14.2,
        beam: 13.9,
        floor: 14.6
      },
      breakdown: {
        difficulty: 5.9,
        execution: 8.7,
        deductions: 0.0
      },
      career: {
        competitions: 38,
        medals: 24,
        avgScore: 14.4
      }
    },
    "athlete-3": {
      name: "Nadia Comaneci",
      country: "ROM",
      scores: {
        vault: 14.9,
        bars: 14.8,
        beam: 14.5,
        floor: 14.3
      },
      breakdown: {
        difficulty: 6.0,
        execution: 8.5,
        deductions: 0.0
      },
      career: {
        competitions: 52,
        medals: 28,
        avgScore: 14.6
      }
    },
    "athlete-4": {
      name: "Shannon Miller",
      country: "USA",
      scores: {
        vault: 14.7,
        bars: 14.4,
        beam: 14.2,
        floor: 14.1
      },
      breakdown: {
        difficulty: 5.8,
        execution: 8.3,
        deductions: 0.0
      },
      career: {
        competitions: 41,
        medals: 30,
        avgScore: 14.3
      }
    }
  }

  const getComparisonData = () => {
    return selectedAthletes.map(athleteId => {
      const athlete = athletes[athleteId as keyof typeof athletes]
      return {
        name: athlete.name.split(' ')[1], // Last name for chart
        vault: athlete.scores.vault,
        bars: athlete.scores.bars,
        beam: athlete.scores.beam,
        floor: athlete.scores.floor,
        difficulty: athlete.breakdown.difficulty,
        execution: athlete.breakdown.execution,
        avgScore: athlete.career.avgScore
      }
    })
  }

  const getRadarData = () => {
    const metrics = ['Power', 'Flexibility', 'Balance', 'Coordination', 'Strength', 'Precision']
    return metrics.map(metric => {
      const data: { subject: string; [key: string]: string | number } = { subject: metric }
      selectedAthletes.forEach((athleteId, index) => {
        // Mock performance ratings based on scores
        const athlete = athletes[athleteId as keyof typeof athletes]
        const baseScore = athlete.career.avgScore
        data[`athlete${index + 1}`] = Math.round((baseScore / 15) * 100 + (Math.random() - 0.5) * 10)
      })
      return data
    })
  }

  const comparisonData = getComparisonData()
  const radarData = getRadarData()

  const headToHeadData = selectedAthletes.map(athleteId => {
    const athlete = athletes[athleteId as keyof typeof athletes]
    return {
      name: athlete.name,
      country: athlete.country,
      ...athlete.scores,
      ...athlete.breakdown,
      ...athlete.career
    }
  })

  return (
    <div className="space-y-6">
      {/* Comparison Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Athlete Comparison</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedAthletes[0]} onValueChange={(value) => setSelectedAthletes([value, selectedAthletes[1]])}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="athlete-1">Simone Biles</SelectItem>
              <SelectItem value="athlete-2">Katelyn Ohashi</SelectItem>
              <SelectItem value="athlete-3">Nadia Comaneci</SelectItem>
              <SelectItem value="athlete-4">Shannon Miller</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-slate-400">vs</span>

          <Select value={selectedAthletes[1]} onValueChange={(value) => setSelectedAthletes([selectedAthletes[0], value])}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              <SelectItem value="athlete-1">Simone Biles</SelectItem>
              <SelectItem value="athlete-2">Katelyn Ohashi</SelectItem>
              <SelectItem value="athlete-3">Nadia Comaneci</SelectItem>
              <SelectItem value="athlete-4">Shannon Miller</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="head-to-head" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800 border-slate-600">
          <TabsTrigger value="head-to-head" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
            Head-to-Head
          </TabsTrigger>
          <TabsTrigger value="event-comparison" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
            Event Analysis
          </TabsTrigger>
          <TabsTrigger value="performance-radar" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-300">
            Performance Radar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="head-to-head" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {headToHeadData.map((athlete, index) => (
              <motion.div
                key={athlete.name}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white">{athlete.name}</CardTitle>
                        <CardDescription className="text-slate-400">{athlete.country}</CardDescription>
                      </div>
                      <Badge variant="outline" className={`${index === 0 ? 'border-emerald-400 text-emerald-400' : 'border-blue-400 text-blue-400'}`}>
                        Athlete {index + 1}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Scores */}
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-yellow-400" />
                        Current Scores
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-slate-400 text-sm">Vault</p>
                          <p className="text-white font-bold">{athlete.vault}</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-slate-400 text-sm">Bars</p>
                          <p className="text-white font-bold">{athlete.bars}</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-slate-400 text-sm">Beam</p>
                          <p className="text-white font-bold">{athlete.beam}</p>
                        </div>
                        <div className="p-3 bg-slate-700/50 rounded-lg">
                          <p className="text-slate-400 text-sm">Floor</p>
                          <p className="text-white font-bold">{athlete.floor}</p>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2 text-blue-400" />
                        Score Breakdown
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Difficulty</span>
                          <span className="text-blue-400 font-semibold">{athlete.difficulty}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Execution</span>
                          <span className="text-purple-400 font-semibold">{athlete.execution}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Deductions</span>
                          <span className="text-red-400 font-semibold">-{athlete.deductions}</span>
                        </div>
                      </div>
                    </div>

                    {/* Career Stats */}
                    <div>
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <Award className="h-4 w-4 mr-2 text-purple-400" />
                        Career Statistics
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Competitions</span>
                          <span className="text-white font-semibold">{athlete.competitions}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Medals</span>
                          <span className="text-yellow-400 font-semibold">{athlete.medals}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Avg Score</span>
                          <span className="text-emerald-400 font-semibold">{athlete.avgScore}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="event-comparison" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Event Score Comparison</CardTitle>
              <CardDescription className="text-slate-400">
                Side-by-side event performance analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9CA3AF" />
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
                  <Bar dataKey="vault" fill="#10B981" name="Vault" />
                  <Bar dataKey="bars" fill="#3B82F6" name="Uneven Bars" />
                  <Bar dataKey="beam" fill="#8B5CF6" name="Balance Beam" />
                  <Bar dataKey="floor" fill="#F59E0B" name="Floor Exercise" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Difficulty vs Execution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
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
                    <Bar dataKey="difficulty" fill="#3B82F6" name="Difficulty" />
                    <Bar dataKey="execution" fill="#8B5CF6" name="Execution" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Average Score Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
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
                      dataKey="avgScore"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                      name="Career Average"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance-radar" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Performance Comparison Radar</CardTitle>
              <CardDescription className="text-slate-400">
                Multi-dimensional performance analysis across key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 100]}
                    tick={{ fill: '#9CA3AF', fontSize: 10 }}
                  />
                  <Radar
                    name={athletes[selectedAthletes[0] as keyof typeof athletes].name}
                    dataKey="athlete1"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Radar
                    name={athletes[selectedAthletes[1] as keyof typeof athletes].name}
                    dataKey="athlete2"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedAthletes.map((athleteId, index) => {
              const athlete = athletes[athleteId as keyof typeof athletes]
              const radarScores = radarData.map(d => Number(d[`athlete${index + 1}`]))
              const avgPerformance = radarScores.reduce((a, b) => a + b, 0) / radarScores.length

              return (
                <Card key={athleteId} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">{athlete.name} - Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-2">
                          {avgPerformance.toFixed(1)}%
                        </div>
                        <p className="text-slate-400">Overall Performance Rating</p>
                      </div>

                      <div className="space-y-3">
                        {radarData.map((metric, metricIndex) => (
                          <div key={metric.subject} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-slate-400">{metric.subject}</span>
                              <span className="text-white">{metric[`athlete${index + 1}`]}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  index === 0
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-400'
                                }`}
                                style={{ width: `${metric[`athlete${index + 1}`]}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
