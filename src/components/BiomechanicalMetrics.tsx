"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Target,
  Zap,
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  BarChart3,
  Gauge,
  Star,
  HelpCircle
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { motion } from "framer-motion"

interface BiomechanicalMetricsProps {
  selectedAthlete: string
}

export default function BiomechanicalMetrics({ selectedAthlete }: BiomechanicalMetricsProps) {
  const [metrics, setMetrics] = useState({
    // Event-Specific Metrics
    artistrySmoothness: 92,
    leapPrecision: 88,
    tumblingAmplitude: 85,

    // General Biomechanical Metrics
    angleOfElevation: 78, // degrees
    centerOfMassHeight: 1.42, // meters
    flightTime: 0.85, // seconds

    // Joint Angles (degrees)
    kneeAngleL: 165,
    kneeAngleR: 168,
    shoulderAngleL: 182,
    shoulderAngleR: 178,

    // Joint Velocities (deg/s)
    elbowVelocityL: 245,
    elbowVelocityR: 238,
    hipVelocityL: 156,
    hipVelocityR: 162,
    kneeVelocityL: 187,
    kneeVelocityR: 183,
    shoulderVelocityL: 198,
    shoulderVelocityR: 201,

    // Injury Prevention Metrics
    aclRisk: 15, // percentage
    landingStability: 94,
    stepSize: "minimal", // minimal, small, large, hop

    // Performance Indicators
    executionQuality: 91,
    overallQualityScore: 89,
    technicalPrecision: 87
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        artistrySmoothness: Math.max(70, Math.min(100, prev.artistrySmoothness + (Math.random() - 0.5) * 3)),
        leapPrecision: Math.max(70, Math.min(100, prev.leapPrecision + (Math.random() - 0.5) * 3)),
        tumblingAmplitude: Math.max(70, Math.min(100, prev.tumblingAmplitude + (Math.random() - 0.5) * 3)),
        landingStability: Math.max(80, Math.min(100, prev.landingStability + (Math.random() - 0.5) * 2)),
        aclRisk: Math.max(5, Math.min(30, prev.aclRisk + (Math.random() - 0.5) * 2)),
        flightTime: Math.max(0.6, Math.min(1.2, prev.flightTime + (Math.random() - 0.5) * 0.05))
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const getRiskLevel = (risk: number) => {
    if (risk <= 10) return { level: "Low", color: "text-emerald-400", bgColor: "bg-emerald-500/20" }
    if (risk <= 20) return { level: "Moderate", color: "text-yellow-400", bgColor: "bg-yellow-500/20" }
    return { level: "High", color: "text-red-400", bgColor: "bg-red-500/20" }
  }

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Excellent", color: "text-cyan-400", icon: CheckCircle }
    if (score >= 80) return { level: "Good", color: "text-blue-400", icon: TrendingUp }
    if (score >= 70) return { level: "Fair", color: "text-yellow-400", icon: Activity }
    return { level: "Needs Work", color: "text-orange-400", icon: AlertTriangle }
  }

  const aclRiskLevel = getRiskLevel(metrics.aclRisk)

  const eventSpecificMetrics = [
    {
      name: "Artistry Smoothness",
      value: metrics.artistrySmoothness,
      unit: "%",
      description: "Flow, grace, and aesthetic quality of movements",
      icon: Star,
      target: 90
    },
    {
      name: "Leap Precision",
      value: metrics.leapPrecision,
      unit: "%",
      description: "Accuracy and correctness of split leaps and jumps",
      icon: Target,
      target: 85
    },
    {
      name: "Tumbling Amplitude",
      value: metrics.tumblingAmplitude,
      unit: "%",
      description: "Vertical height and power achieved during tumbling",
      icon: ArrowUp,
      target: 80
    }
  ]

  const biomechanicalMetrics = [
    {
      name: "Angle of Elevation",
      value: metrics.angleOfElevation,
      unit: "°",
      description: "Body angle during lift-off",
      optimal: "75-85°"
    },
    {
      name: "Center of Mass Height",
      value: metrics.centerOfMassHeight,
      unit: "m",
      description: "Average body height during performance",
      optimal: "1.3-1.5m"
    },
    {
      name: "Flight Time",
      value: metrics.flightTime,
      unit: "s",
      description: "Duration of airborne movement",
      optimal: "0.8-1.0s"
    }
  ]

  const jointAngles = [
    { name: "Left Knee", value: metrics.kneeAngleL, unit: "°", optimal: "160-180°" },
    { name: "Right Knee", value: metrics.kneeAngleR, unit: "°", optimal: "160-180°" },
    { name: "Left Shoulder", value: metrics.shoulderAngleL, unit: "°", optimal: "170-190°" },
    { name: "Right Shoulder", value: metrics.shoulderAngleR, unit: "°", optimal: "170-190°" }
  ]

  const jointVelocities = [
    { name: "Left Elbow", value: metrics.elbowVelocityL, unit: "°/s", category: "Control" },
    { name: "Right Elbow", value: metrics.elbowVelocityR, unit: "°/s", category: "Control" },
    { name: "Left Hip", value: metrics.hipVelocityL, unit: "°/s", category: "Stability" },
    { name: "Right Hip", value: metrics.hipVelocityR, unit: "°/s", category: "Stability" },
    { name: "Left Knee", value: metrics.kneeVelocityL, unit: "°/s", category: "Power" },
    { name: "Right Knee", value: metrics.kneeVelocityR, unit: "°/s", category: "Power" },
    { name: "Left Shoulder", value: metrics.shoulderVelocityL, unit: "°/s", category: "Control" },
    { name: "Right Shoulder", value: metrics.shoulderVelocityR, unit: "°/s", category: "Control" }
  ]

  return (
    <TooltipProvider>
      <div className="space-y-6">
      <Tabs defaultValue="event-specific" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-900 border-slate-700">
          <TabsTrigger value="event-specific" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Event Metrics
          </TabsTrigger>
          <TabsTrigger value="biomechanical" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Biomechanical
          </TabsTrigger>
          <TabsTrigger value="joint-angles" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Joint Angles
          </TabsTrigger>
          <TabsTrigger value="joint-velocities" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Joint Velocities
          </TabsTrigger>
          <TabsTrigger value="injury-prevention" className="data-[state=active]:bg-slate-800 data-[state=active]:text-cyan-400 text-slate-400">
            Injury Prevention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="event-specific" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {eventSpecificMetrics.map((metric, index) => {
              const performance = getPerformanceLevel(metric.value)
              return (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm hover:bg-slate-900/70 transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="p-2 rounded-lg bg-slate-800">
                            <metric.icon className="h-4 w-4 text-cyan-400" />
                          </div>
                          <div>
                            <CardTitle className="text-white text-sm flex items-center">
                              {metric.name}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <div className="space-y-1">
                                    <p className="text-xs leading-tight">{metric.description || `Event-specific measurement for ${metric.name.toLowerCase()}`}</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </CardTitle>
                          </div>
                        </div>
                        <Badge className={`${performance.color} bg-slate-800 border-slate-700`}>
                          {performance.level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-4">
                        <div className="flex items-baseline space-x-2 mb-2">
                          <span className="text-2xl font-bold text-white">
                            {metric.value.toFixed(1)}
                          </span>
                          <span className="text-slate-400 text-sm">{metric.unit}</span>
                        </div>
                        <Progress
                          value={metric.value}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-slate-400 mt-1">
                          <span>Target: {metric.target}+</span>
                          <span>{metric.value >= metric.target ? "✓" : "△"}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {metric.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="biomechanical" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {biomechanicalMetrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-white text-sm flex items-center">
                      <Gauge className="h-4 w-4 text-cyan-400 mr-2" />
                      {metric.name}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3 w-3 text-slate-400 ml-1 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="space-y-1">
                            <p className="text-xs leading-tight">{metric.description || `Detailed measurement of ${metric.name.toLowerCase()}`}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-cyan-400 mb-1">
                        {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                      </div>
                      <div className="text-slate-400 text-sm">{metric.unit}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400">{metric.description}</div>
                      <div className="text-xs text-slate-300">
                        <span className="text-cyan-400">Optimal:</span> {metric.optimal}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="joint-angles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jointAngles.map((joint, index) => (
              <motion.div
                key={joint.name}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">{joint.name}</h3>
                      <div className="text-right">
                        <div className="text-xl font-bold text-cyan-400">
                          {joint.value}°
                        </div>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                          style={{ width: `${Math.min(100, (joint.value / 180) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">
                      Optimal range: {joint.optimal}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="joint-velocities" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jointVelocities.map((velocity, index) => (
              <motion.div
                key={velocity.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                  <CardContent className="p-3">
                    <div className="text-center">
                      <Badge className="mb-2 text-xs bg-slate-800 text-slate-300 border-slate-700">
                        {velocity.category}
                      </Badge>
                      <h3 className="text-white font-semibold text-sm mb-1">{velocity.name}</h3>
                      <div className="text-lg font-bold text-cyan-400">
                        {velocity.value}
                      </div>
                      <div className="text-xs text-slate-400">{velocity.unit}</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="injury-prevention" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ACL Risk */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Shield className="h-5 w-5 text-red-400 mr-2" />
                  ACL Risk
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-slate-400 ml-2 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs leading-tight">Anterior Cruciate Ligament</p>
                        <p className="text-xs leading-tight">injury risk assessment</p>
                        <p className="text-xs leading-tight">based on landing mechanics</p>
                        <p className="text-xs leading-tight">and joint angles</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className={`text-3xl font-bold ${aclRiskLevel.color} mb-2`}>
                    {metrics.aclRisk.toFixed(1)}%
                  </div>
                  <Badge className={`${aclRiskLevel.bgColor} ${aclRiskLevel.color} border-0`}>
                    {aclRiskLevel.level} Risk
                  </Badge>
                </div>
                <Progress
                  value={100 - metrics.aclRisk}
                  className="h-2 mb-2"
                />
                <p className="text-xs text-slate-400 text-center">
                  Composite risk assessment for knee injury
                </p>
              </CardContent>
            </Card>

            {/* Landing Stability */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mr-2" />
                  Landing Stability
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-slate-400 ml-2 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs leading-tight">Measures how stable and</p>
                        <p className="text-xs leading-tight">controlled the athlete's</p>
                        <p className="text-xs leading-tight">landing is after tumbling</p>
                        <p className="text-xs leading-tight">or vaulting</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-emerald-400 mb-2">
                    {metrics.landingStability.toFixed(1)}%
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0">
                    Excellent
                  </Badge>
                </div>
                <Progress
                  value={metrics.landingStability}
                  className="h-2 mb-2"
                />
                <p className="text-xs text-slate-400 text-center">
                  Steadiness and balance during landings
                </p>
              </CardContent>
            </Card>

            {/* Step Size */}
            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="h-5 w-5 text-cyan-400 mr-2" />
                  Landing Quality
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-slate-400 ml-2 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="space-y-1">
                        <p className="text-xs leading-tight">Overall assessment of</p>
                        <p className="text-xs leading-tight">landing technique, including</p>
                        <p className="text-xs leading-tight">foot placement and</p>
                        <p className="text-xs leading-tight">body control</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-cyan-400 mb-2 capitalize">
                    {metrics.stepSize}
                  </div>
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
                    Step Size
                  </Badge>
                </div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div className="flex justify-between">
                    <span>Minimal</span>
                    <span className={metrics.stepSize === "minimal" ? "text-cyan-400" : ""}>●</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Small</span>
                    <span className={metrics.stepSize === "small" ? "text-yellow-400" : ""}>●</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Large</span>
                    <span className={metrics.stepSize === "large" ? "text-orange-400" : ""}>●</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Indicators */}
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Performance Quality Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400 mb-1">
                    {metrics.executionQuality}%
                  </div>
                  <div className="text-slate-300 font-semibold mb-2">Execution Quality</div>
                  <Progress value={metrics.executionQuality} className="h-2" />
                  <p className="text-xs text-slate-400 mt-2">Smoothness and artistry of movement</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">
                    {metrics.overallQualityScore}%
                  </div>
                  <div className="text-slate-300 font-semibold mb-2">Overall Quality</div>
                  <Progress value={metrics.overallQualityScore} className="h-2" />
                  <p className="text-xs text-slate-400 mt-2">Weighted composite performance score</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {metrics.technicalPrecision}%
                  </div>
                  <div className="text-slate-300 font-semibold mb-2">Technical Precision</div>
                  <Progress value={metrics.technicalPrecision} className="h-2" />
                  <p className="text-xs text-slate-400 mt-2">Joint position accuracy and consistency</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </TooltipProvider>
  )
}
