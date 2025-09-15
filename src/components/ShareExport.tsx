"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Share2,
  Download,
  Mail,
  Link,
  FileText,
  Video,
  BarChart3,
  Copy,
  Send,
  Check
} from "lucide-react"
import { motion } from "framer-motion"

export default function ShareExport() {
  const [shareEmails, setShareEmails] = useState("")
  const [exportOptions, setExportOptions] = useState({
    includeVideo: true,
    includeAnalytics: true,
    includeMotionIQ: true,
    format: "pdf"
  })
  const [linkCopied, setLinkCopied] = useState(false)

  const recentShares = [
    {
      id: 1,
      type: "Video Analysis",
      recipient: "assistant@gymnastics.edu",
      athlete: "Simone Biles",
      sharedDate: "2 hours ago",
      status: "viewed"
    },
    {
      id: 2,
      type: "Motion IQ Report",
      recipient: "parent@gmail.com",
      athlete: "Katelyn Ohashi",
      sharedDate: "1 day ago",
      status: "pending"
    },
    {
      id: 3,
      type: "Performance Analytics",
      recipient: "team@gymnastics.com",
      athlete: "Multiple Athletes",
      sharedDate: "3 days ago",
      status: "viewed"
    }
  ]

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://motionlabs.ai/share/abc123")
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "viewed": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
      case "pending": return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/30"
    }
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Share & Export</h1>
            <p className="text-slate-400">Share analysis and export reports</p>
          </div>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            Coach Tools
          </Badge>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Quick Share */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Share2 className="h-5 w-5 text-cyan-400 mr-2" />
                Quick Share
              </CardTitle>
              <CardDescription className="text-slate-400">
                Share video analysis with athletes, parents, or staff
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="emails" className="text-slate-300">Email Recipients</Label>
                <Input
                  id="emails"
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  placeholder="Enter email addresses separated by commas"
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium text-sm">Include in Share:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeVideo}
                      onChange={(e) => setExportOptions({...exportOptions, includeVideo: e.target.checked})}
                      className="rounded border-slate-600"
                    />
                    <span className="text-slate-300 text-sm">Video</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeAnalytics}
                      onChange={(e) => setExportOptions({...exportOptions, includeAnalytics: e.target.checked})}
                      className="rounded border-slate-600"
                    />
                    <span className="text-slate-300 text-sm">Analytics</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeMotionIQ}
                      onChange={(e) => setExportOptions({...exportOptions, includeMotionIQ: e.target.checked})}
                      className="rounded border-slate-600"
                    />
                    <span className="text-slate-300 text-sm">Motion IQ</span>
                  </label>
                </div>
              </div>

              <Button className="w-full bg-gradient-to-r from-cyan-600 to-cyan-700 text-black">
                <Send className="h-4 w-4 mr-2" />
                Send Share Link
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Link className="h-5 w-5 text-blue-400 mr-2" />
                Generate Share Link
              </CardTitle>
              <CardDescription className="text-slate-400">
                Create a secure link for easy sharing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between">
                  <code className="text-cyan-400 text-sm">
                    https://motionlabs.ai/share/abc123
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    className="text-slate-400 hover:text-cyan-400"
                  >
                    {linkCopied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-white font-medium text-sm">Link Settings:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Expires:</span>
                    <span>7 days</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Password Protected:</span>
                    <span>Yes</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>View Limit:</span>
                    <span>Unlimited</span>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-white">
                Configure Link Settings
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export Options */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Download className="h-5 w-5 text-emerald-400 mr-2" />
              Export Reports
            </CardTitle>
            <CardDescription className="text-slate-400">
              Download comprehensive analysis reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-all cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <FileText className="h-8 w-8 text-red-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-2">PDF Report</h3>
                    <p className="text-slate-400 text-xs mb-3">
                      Comprehensive analysis with charts and insights
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Generate PDF
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-all cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <BarChart3 className="h-8 w-8 text-green-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-2">Excel Data</h3>
                    <p className="text-slate-400 text-xs mb-3">
                      Raw data export for custom analysis
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Export Excel
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card className="bg-slate-800/50 border-slate-700 hover:border-cyan-500 transition-all cursor-pointer">
                  <CardContent className="p-4 text-center">
                    <Video className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                    <h3 className="text-white font-semibold mb-2">Video Package</h3>
                    <p className="text-slate-400 text-xs mb-3">
                      Video with embedded analytics overlay
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      Create Video
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Shares */}
        <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent Shares</CardTitle>
            <CardDescription className="text-slate-400">
              Track your shared content and recipient activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentShares.map((share, index) => (
                <motion.div
                  key={share.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      {share.type.includes("Video") ? (
                        <Video className="h-5 w-5 text-purple-400" />
                      ) : share.type.includes("Report") ? (
                        <FileText className="h-5 w-5 text-red-400" />
                      ) : (
                        <BarChart3 className="h-5 w-5 text-green-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{share.type}</h3>
                      <p className="text-slate-400 text-xs">
                        {share.athlete} • Sent to {share.recipient}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={`${getStatusColor(share.status)} border text-xs`}>
                      {share.status}
                    </Badge>
                    <span className="text-slate-400 text-xs">{share.sharedDate}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
