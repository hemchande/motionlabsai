"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, Users, Trophy, Clock, Play, Pause, RotateCcw, Settings, LogOut } from "lucide-react"
import LiveMetrics from "./LiveMetrics"
import PerformanceCharts from "./PerformanceCharts"
import VideoReplay from "./VideoReplay"
import AthleteComparison from "./AthleteComparison"
import LiveScoring from "./LiveScoring"

export default function AnalyticsDashboard() {
  const [selectedAthlete, setSelectedAthlete] = useState("athlete-1")
  const [activeEvent, setActiveEvent] = useState("floor")
  const [isLive, setIsLive] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {/* MotionLabs AI Logo */}
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <div className="text-black font-bold text-lg transform rotate-12">M</div>
                  <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-400 transform rotate-45 rounded-sm" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">MotionLabs AI</h1>
                  <p className="text-xs text-slate-400">Advanced Analytics Platform</p>
                </div>
              </div>
              <Badge variant={isLive ? "default" : "secondary"} className="bg-cyan-500 text-black animate-pulse">
                {isLive ? "LIVE" : "OFFLINE"}
              </Badge>
            </div>

            <div className="flex items-center space-x-4">
              <Select value={activeEvent} onValueChange={setActiveEvent}>
                <SelectTrigger className="w-32 bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="floor">Floor</SelectItem>
                  <SelectItem value="vault">Vault</SelectItem>
                  <SelectItem value="beam">Beam</SelectItem>
                  <SelectItem value="bars">Uneven Bars</SelectItem>
                  <SelectItem value="rings">Rings</SelectItem>
                  <SelectItem value="pommel">Pommel Horse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                <SelectTrigger className="w-40 bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="athlete-1">Simone Biles</SelectItem>
                  <SelectItem value="athlete-2">Katelyn Ohashi</SelectItem>
                  <SelectItem value="athlete-3">Nadia Comaneci</SelectItem>
                  <SelectItem value="athlete-4">Shannon Miller</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800">
                <Settings className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" className="bg-slate-900 border-slate-700 text-white hover:bg-slate-800">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-5 bg-slate-900 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
              Overview
            </TabsTrigger>
            <TabsTrigger value="live-scoring" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
              Live Scoring
            </TabsTrigger>
            <TabsTrigger value="video-analysis" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
              Video Analysis
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
              Performance
            </TabsTrigger>
            <TabsTrigger value="comparison" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <LiveMetrics selectedAthlete={selectedAthlete} activeEvent={activeEvent} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PerformanceCharts selectedAthlete={selectedAthlete} />
              <VideoReplay selectedAthlete={selectedAthlete} compact={true} />
            </div>
          </TabsContent>

          <TabsContent value="live-scoring">
            <LiveScoring activeEvent={activeEvent} />
          </TabsContent>

          <TabsContent value="video-analysis">
            <VideoReplay selectedAthlete={selectedAthlete} />
          </TabsContent>

          <TabsContent value="performance">
            <PerformanceCharts selectedAthlete={selectedAthlete} detailed={true} />
          </TabsContent>

          <TabsContent value="comparison">
            <AthleteComparison activeEvent={activeEvent} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
