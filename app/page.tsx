"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Server,
  Users,
  Video,
  Shield,
  Activity,
  Play,
  Radio,
  Globe,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  Monitor,
  LogOut,
  Edit,
  VideoIcon,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { clearAuth, getUsername } from "@/lib/auth"
import { StreamPlayer } from "@/components/stream-player"
import * as api from "@/lib/mediamtx-api"
import type { PathConfig, Path as LivePath } from "@/lib/mediamtx-api"

function MediaMTXDashboard() {
  const router = useRouter()
  const username = getUsername()

  const [config, setConfig] = useState({
    logLevel: "info",
    rtsp: true,
    rtspAddress: ":8554",
    rtmp: true,
    rtmpAddress: ":1935",
    hls: true,
    hlsAddress: ":8888",
    webrtc: true,
    webrtcAddress: ":8889",
    api: false,
    apiAddress: ":9997",
    metrics: false,
    metricsAddress: ":9998",
  })

  const [paths, setPaths] = useState<PathConfig[]>([])
  const [livePaths, setLivePaths] = useState<LivePath[]>([])
  const [isLoadingPaths, setIsLoadingPaths] = useState(false)
  const [selectedStreamPath, setSelectedStreamPath] = useState<string | null>(null)
  const [editingPath, setEditingPath] = useState<PathConfig | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [pathToDelete, setPathToDelete] = useState<string | null>(null)

  const [isAddPathDialogOpen, setIsAddPathDialogOpen] = useState(false)
  const [newPath, setNewPath] = useState({
    name: "",
    source: "",
    sourceFingerprint: "",
    sourceOnDemand: true,
    record: false,
    recordPath: "./recordings/%path/%Y-%m-%d_%H-%M-%S-%f",
    recordFormat: "fmp4",
    recordPartDuration: "1s",
    recordSegmentDuration: "1h",
    recordDeleteAfter: "0s",
    maxReaders: 0,
    overridePublisher: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchPaths = async () => {
    setIsLoadingPaths(true)
    try {
      const [configs, live] = await Promise.all([api.getPathConfigs(), api.getPaths()])
      setPaths(configs.filter((p) => p.name !== "all_others"))
      setLivePaths(live)
    } catch (error) {
      console.error("Error fetching paths:", error)
      alert("Failed to load paths")
    } finally {
      setIsLoadingPaths(false)
    }
  }

  useEffect(() => {
    fetchPaths()
    const interval = setInterval(fetchPaths, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const handleEditPath = async (path: PathConfig) => {
    setEditingPath(path)
    setIsEditDialogOpen(true)
  }

  const handleUpdatePath = async () => {
    if (!editingPath) return

    setIsSubmitting(true)
    try {
      await api.updatePath(editingPath.name, editingPath)
      await fetchPaths()
      setIsEditDialogOpen(false)
      setEditingPath(null)
      alert("Path updated successfully!")
    } catch (error) {
      console.error("Error updating path:", error)
      alert(`Failed to update path: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePath = async () => {
    if (!pathToDelete) return

    setIsSubmitting(true)
    try {
      await api.deletePath(pathToDelete)
      await fetchPaths()
      setIsDeleteDialogOpen(false)
      setPathToDelete(null)
      alert("Path deleted successfully!")
    } catch (error) {
      console.error("Error deleting path:", error)
      alert(`Failed to delete path: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = (pathName: string) => {
    setPathToDelete(pathName)
    setIsDeleteDialogOpen(true)
  }

  const getPathStatus = (pathName: string) => {
    const livePath = livePaths.find((p) => p.name === pathName)
    return {
      isLive: livePath?.ready || false,
      source: livePath?.source?.type || null,
      readers: livePath?.readers.length || 0,
      bytesReceived: livePath?.bytesReceived || 0,
      bytesSent: livePath?.bytesSent || 0,
    }
  }

  const handleLogout = () => {
    clearAuth()
    router.push("/login")
  }

  const handleAddPath = async () => {
    if (!newPath.name) {
      alert("Please enter a path name")
      return
    }

    if (!newPath.source) {
      alert("Please enter a source URL")
      return
    }

    setIsSubmitting(true)

    try {
      await api.addPath(newPath as PathConfig)
      await fetchPaths()

      // Reset form and close dialog
      setNewPath({
        name: "",
        source: "",
        sourceFingerprint: "",
        sourceOnDemand: true,
        record: false,
        recordPath: "./recordings/%path/%Y-%m-%d_%H-%M-%S-%f",
        recordFormat: "fmp4",
        recordPartDuration: "1s",
        recordSegmentDuration: "1h",
        recordDeleteAfter: "0s",
        maxReaders: 0,
        overridePublisher: true,
      })
      setIsAddPathDialogOpen(false)
      alert("Path added successfully!")
    } catch (error) {
      console.error("Error adding path:", error)
      alert(`Error adding path: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Replace the activeStreams useState with calculated values
  const activeStreamsCount = livePaths.filter((p) => p.ready).length
  const totalViewers = livePaths.reduce((sum, p) => sum + p.readers.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">MediaMTX Dashboard</h1>
                <p className="text-sm text-gray-500">Media streaming server management</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-md">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{username}</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="server" className="flex items-center space-x-2">
              <Server className="w-4 h-4" />
              <span>Server</span>
            </TabsTrigger>
            <TabsTrigger value="paths" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Paths</span>
            </TabsTrigger>
            <TabsTrigger value="auth" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Auth</span>
            </TabsTrigger>
            <TabsTrigger value="recording" className="flex items-center space-x-2">
              <Play className="w-4 h-4" />
              <span>Recording</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Monitoring</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Streams</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeStreamsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeStreamsCount} live, {paths.length - activeStreamsCount} idle
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalViewers}</div>
                  <p className="text-xs text-muted-foreground">Across all streams</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Paths</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{paths.length}</div>
                  <p className="text-xs text-muted-foreground">Configured paths</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Server Status</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Online</div>
                  <p className="text-xs text-muted-foreground">Running smoothly</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active Streams</CardTitle>
                <CardDescription>Currently active streaming paths and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingPaths ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                    <p className="text-sm text-gray-600">Loading streams...</p>
                  </div>
                ) : paths.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <VideoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No paths configured</p>
                    <Button className="mt-4" onClick={() => setIsAddPathDialogOpen(true)}>
                      Add Your First Path
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paths.map((path) => {
                      const status = getPathStatus(path.name)
                      return (
                        <div key={path.name} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                <VideoIcon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{path.name}</h3>
                                  {status.isLive && (
                                    <Badge variant="default" className="bg-red-500">
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                                      LIVE
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{path.source}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span>{status.readers} viewers</span>
                                  {status.isLive && (
                                    <>
                                      <span>↓ {(status.bytesReceived / 1024 / 1024).toFixed(2)} MB</span>
                                      <span>↑ {(status.bytesSent / 1024 / 1024).toFixed(2)} MB</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedStreamPath(selectedStreamPath === path.name ? null : path.name)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditPath(path)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => confirmDelete(path.name)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          {selectedStreamPath === path.name && status.isLive && (
                            <div className="px-4 pb-4">
                              <StreamPlayer pathName={path.name} />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="server" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic server configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logLevel">Log Level</Label>
                    <Select
                      value={config.logLevel}
                      onValueChange={(value) => setConfig({ ...config, logLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="readTimeout">Read Timeout</Label>
                    <Input id="readTimeout" defaultValue="10s" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="writeTimeout">Write Timeout</Label>
                    <Input id="writeTimeout" defaultValue="10s" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Protocol Settings</CardTitle>
                  <CardDescription>Enable/disable streaming protocols</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>RTSP Server</Label>
                      <p className="text-sm text-muted-foreground">Real Time Streaming Protocol</p>
                    </div>
                    <Switch
                      checked={config.rtsp}
                      onCheckedChange={(checked) => setConfig({ ...config, rtsp: checked })}
                    />
                  </div>
                  {config.rtsp && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="rtspAddress">RTSP Address</Label>
                      <Input
                        id="rtspAddress"
                        value={config.rtspAddress}
                        onChange={(e) => setConfig({ ...config, rtspAddress: e.target.value })}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>RTMP Server</Label>
                      <p className="text-sm text-muted-foreground">Real Time Messaging Protocol</p>
                    </div>
                    <Switch
                      checked={config.rtmp}
                      onCheckedChange={(checked) => setConfig({ ...config, rtmp: checked })}
                    />
                  </div>
                  {config.rtmp && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="rtmpAddress">RTMP Address</Label>
                      <Input
                        id="rtmpAddress"
                        value={config.rtmpAddress}
                        onChange={(e) => setConfig({ ...config, rtmpAddress: e.target.value })}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>HLS Server</Label>
                      <p className="text-sm text-muted-foreground">HTTP Live Streaming</p>
                    </div>
                    <Switch
                      checked={config.hls}
                      onCheckedChange={(checked) => setConfig({ ...config, hls: checked })}
                    />
                  </div>
                  {config.hls && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="hlsAddress">HLS Address</Label>
                      <Input
                        id="hlsAddress"
                        value={config.hlsAddress}
                        onChange={(e) => setConfig({ ...config, hlsAddress: e.target.value })}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>WebRTC Server</Label>
                      <p className="text-sm text-muted-foreground">Web Real-Time Communication</p>
                    </div>
                    <Switch
                      checked={config.webrtc}
                      onCheckedChange={(checked) => setConfig({ ...config, webrtc: checked })}
                    />
                  </div>
                  {config.webrtc && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="webrtcAddress">WebRTC Address</Label>
                      <Input
                        id="webrtcAddress"
                        value={config.webrtcAddress}
                        onChange={(e) => setConfig({ ...config, webrtcAddress: e.target.value })}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>API & Monitoring</CardTitle>
                <CardDescription>Control API and metrics endpoints</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Control API</Label>
                        <p className="text-sm text-muted-foreground">Enable REST API</p>
                      </div>
                      <Switch
                        checked={config.api}
                        onCheckedChange={(checked) => setConfig({ ...config, api: checked })}
                      />
                    </div>
                    {config.api && (
                      <div className="space-y-2 ml-4">
                        <Label htmlFor="apiAddress">API Address</Label>
                        <Input
                          id="apiAddress"
                          value={config.apiAddress}
                          onChange={(e) => setConfig({ ...config, apiAddress: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Metrics</Label>
                        <p className="text-sm text-muted-foreground">Prometheus metrics</p>
                      </div>
                      <Switch
                        checked={config.metrics}
                        onCheckedChange={(checked) => setConfig({ ...config, metrics: checked })}
                      />
                    </div>
                    {config.metrics && (
                      <div className="space-y-2 ml-4">
                        <Label htmlFor="metricsAddress">Metrics Address</Label>
                        <Input
                          id="metricsAddress"
                          value={config.metricsAddress}
                          onChange={(e) => setConfig({ ...config, metricsAddress: e.target.value })}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paths" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Stream Paths</CardTitle>
                    <CardDescription>Configure streaming paths and sources</CardDescription>
                  </div>
                  <Dialog open={isAddPathDialogOpen} onOpenChange={setIsAddPathDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Path
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Path</DialogTitle>
                        <DialogDescription>Configure a new streaming path in MediaMTX</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="pathName">Path Name *</Label>
                          <Input
                            id="pathName"
                            placeholder="e.g., cam1, camera1"
                            value={newPath.name}
                            onChange={(e) => setNewPath({ ...newPath, name: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">Unique identifier for this path</p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="source">Source URL *</Label>
                          <Input
                            id="source"
                            placeholder="rtsp://admin:password@192.168.50.50"
                            value={newPath.source}
                            onChange={(e) => setNewPath({ ...newPath, source: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            RTSP, RTMP, or HLS URL. Example: rtsp://admin:Admin1234@192.168.50.50
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sourceFingerprint">Source Fingerprint (Optional)</Label>
                          <Input
                            id="sourceFingerprint"
                            placeholder="SHA-256 fingerprint"
                            value={newPath.sourceFingerprint}
                            onChange={(e) => setNewPath({ ...newPath, sourceFingerprint: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Optional SHA-256 fingerprint for RTSPS sources
                          </p>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newPath.sourceOnDemand}
                            onCheckedChange={(checked) => setNewPath({ ...newPath, sourceOnDemand: checked })}
                          />
                          <Label>Source On Demand</Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                          Start source only when requested by a client
                        </p>

                        <Separator />

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newPath.record}
                            onCheckedChange={(checked) => setNewPath({ ...newPath, record: checked })}
                          />
                          <Label>Enable Recording</Label>
                        </div>

                        {newPath.record && (
                          <>
                            <div className="space-y-2">
                              <Label htmlFor="recordPath">Recording Path</Label>
                              <Input
                                id="recordPath"
                                value={newPath.recordPath}
                                onChange={(e) => setNewPath({ ...newPath, recordPath: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground">
                                Variables: %path, %Y %m %d (date), %H %M %S (time)
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="recordFormat">Format</Label>
                                <Select
                                  value={newPath.recordFormat}
                                  onValueChange={(value) => setNewPath({ ...newPath, recordFormat: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="fmp4">Fragmented MP4</SelectItem>
                                    <SelectItem value="mpegts">MPEG-TS</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="recordPartDuration">Part Duration</Label>
                                <Input
                                  id="recordPartDuration"
                                  value={newPath.recordPartDuration}
                                  onChange={(e) => setNewPath({ ...newPath, recordPartDuration: e.target.value })}
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="recordSegmentDuration">Segment Duration</Label>
                                <Input
                                  id="recordSegmentDuration"
                                  value={newPath.recordSegmentDuration}
                                  onChange={(e) => setNewPath({ ...newPath, recordSegmentDuration: e.target.value })}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="recordDeleteAfter">Delete After</Label>
                                <Input
                                  id="recordDeleteAfter"
                                  value={newPath.recordDeleteAfter}
                                  onChange={(e) => setNewPath({ ...newPath, recordDeleteAfter: e.target.value })}
                                />
                              </div>
                            </div>
                          </>
                        )}

                        <Separator />

                        <div className="space-y-2">
                          <Label htmlFor="maxReaders">Max Readers (0 = unlimited)</Label>
                          <Input
                            id="maxReaders"
                            type="number"
                            value={newPath.maxReaders}
                            onChange={(e) =>
                              setNewPath({ ...newPath, maxReaders: Number.parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={newPath.overridePublisher}
                            onCheckedChange={(checked) => setNewPath({ ...newPath, overridePublisher: checked })}
                          />
                          <Label>Override Publisher</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddPathDialogOpen(false)} disabled={isSubmitting}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddPath} disabled={isSubmitting}>
                          {isSubmitting ? "Adding..." : "Add Path"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingPaths ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-2"></div>
                      <p className="text-sm text-gray-600">Loading paths...</p>
                    </div>
                  ) : paths.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <VideoIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No paths configured</p>
                      <Button className="mt-4" onClick={() => setIsAddPathDialogOpen(true)}>
                        Add Your First Path
                      </Button>
                    </div>
                  ) : (
                    paths.map((path) => {
                      const status = getPathStatus(path.name)
                      return (
                        <div key={path.name} className="border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center space-x-4 flex-1">
                              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                                <VideoIcon className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">{path.name}</h3>
                                  {status.isLive && (
                                    <Badge variant="default" className="bg-red-500">
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-1" />
                                      LIVE
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">{path.source}</p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                  <span>{status.readers} viewers</span>
                                  {status.isLive && (
                                    <>
                                      <span>↓ {(status.bytesReceived / 1024 / 1024).toFixed(2)} MB</span>
                                      <span>↑ {(status.bytesSent / 1024 / 1024).toFixed(2)} MB</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setSelectedStreamPath(selectedStreamPath === path.name ? null : path.name)
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditPath(path)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => confirmDelete(path.name)}>
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          </div>
                          {selectedStreamPath === path.name && status.isLive && (
                            <div className="px-4 pb-4">
                              <StreamPlayer pathName={path.name} />
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication Method</CardTitle>
                <CardDescription>Configure how users authenticate with the server</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Authentication Method</Label>
                  <Select defaultValue="internal">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">Internal (Configuration File)</SelectItem>
                      <SelectItem value="http">HTTP (External URL)</SelectItem>
                      <SelectItem value="jwt">JWT (Identity Server)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Internal Users</CardTitle>
                    <CardDescription>Manage users stored in configuration</CardDescription>
                  </div>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Default User (any)</h3>
                      <Badge variant="secondary">Unprivileged</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value="any" readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" placeholder="No password required" readOnly />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Permissions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge>publish</Badge>
                        <Badge>read</Badge>
                        <Badge>playback</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Administrator</h3>
                      <Badge>Admin</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value="admin" readOnly />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" value="adminpass" readOnly />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label>Permissions</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge>api</Badge>
                        <Badge>metrics</Badge>
                        <Badge>pprof</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recording" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recording Settings</CardTitle>
                <CardDescription>Configure stream recording options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recordFormat">Recording Format</Label>
                      <Select defaultValue="fmp4">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fmp4">Fragmented MP4</SelectItem>
                          <SelectItem value="mpegts">MPEG-TS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="recordPath">Recording Path</Label>
                      <Input defaultValue="./recordings/%path/%Y-%m-%d_%H-%M-%S-%f" />
                      <p className="text-xs text-muted-foreground">
                        Variables: %path, %Y %m %d (date), %H %M %S (time)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="segmentDuration">Segment Duration</Label>
                      <Input defaultValue="1h" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="partDuration">Part Duration</Label>
                      <Input defaultValue="1s" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPartSize">Max Part Size</Label>
                      <Input defaultValue="50M" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deleteAfter">Delete After</Label>
                      <Input defaultValue="1d" />
                      <p className="text-xs text-muted-foreground">Set to 0s to disable automatic deletion</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recording Status</CardTitle>
                <CardDescription>Current recording sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                        <Play className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">camera1</h3>
                        <p className="text-sm text-gray-500">Recording since 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">Recording</Badge>
                      <Button size="sm" variant="outline">
                        Stop
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                        <Play className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">stream2</h3>
                        <p className="text-sm text-gray-500">No active recording</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">Idle</Badge>
                      <Button size="sm" variant="outline">
                        Start
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">23%</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: "23%" }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2GB</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: "45%" }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Network I/O</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45MB/s</div>
                  <p className="text-xs text-muted-foreground">↑ 25MB/s ↓ 20MB/s</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Server Logs</CardTitle>
                <CardDescription>Recent server activity and events</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full border rounded-lg p-4">
                  <div className="space-y-2 text-sm font-mono">
                    <div className="text-blue-600">[INFO] 2024-01-15 14:30:25 - Server started on :8554</div>
                    <div className="text-green-600">[INFO] 2024-01-15 14:30:26 - RTSP server listening on :8554</div>
                    <div className="text-green-600">[INFO] 2024-01-15 14:30:26 - HLS server listening on :8888</div>
                    <div className="text-blue-600">
                      [INFO] 2024-01-15 14:32:15 - New client connected: 192.168.1.100
                    </div>
                    <div className="text-blue-600">[INFO] 2024-01-15 14:32:16 - Stream 'camera1' started</div>
                    <div className="text-yellow-600">[WARN] 2024-01-15 14:35:22 - High CPU usage detected: 85%</div>
                    <div className="text-blue-600">
                      [INFO] 2024-01-15 14:40:10 - Recording started for path 'camera1'
                    </div>
                    <div className="text-green-600">[INFO] 2024-01-15 14:45:33 - WebRTC connection established</div>
                  </div>
                </ScrollArea>
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                    <Select defaultValue="info">
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="warn">Warning</SelectItem>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="debug">Debug</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button size="sm" variant="outline">
                    Clear Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Path: {editingPath?.name}</DialogTitle>
            <DialogDescription>Update the configuration for this streaming path</DialogDescription>
          </DialogHeader>
          {editingPath && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Path Name</Label>
                <Input value={editingPath.name} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="editSource">Source URL</Label>
                <Input
                  id="editSource"
                  value={editingPath.source}
                  onChange={(e) => setEditingPath({ ...editingPath, source: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPath.sourceOnDemand}
                  onCheckedChange={(checked) => setEditingPath({ ...editingPath, sourceOnDemand: checked })}
                />
                <Label>Source On Demand</Label>
              </div>

              <Separator />

              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingPath.record}
                  onCheckedChange={(checked) => setEditingPath({ ...editingPath, record: checked })}
                />
                <Label>Enable Recording</Label>
              </div>

              {editingPath.record && (
                <div className="space-y-4 ml-6">
                  <div className="space-y-2">
                    <Label>Recording Path</Label>
                    <Input
                      value={editingPath.recordPath || ""}
                      onChange={(e) => setEditingPath({ ...editingPath, recordPath: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Format</Label>
                      <Select
                        value={editingPath.recordFormat}
                        onValueChange={(value) => setEditingPath({ ...editingPath, recordFormat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fmp4">Fragmented MP4</SelectItem>
                          <SelectItem value="mpegts">MPEG-TS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Segment Duration</Label>
                      <Input
                        value={editingPath.recordSegmentDuration || ""}
                        onChange={(e) => setEditingPath({ ...editingPath, recordSegmentDuration: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePath} disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Path"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Path</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the path "{pathToDelete}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeletePath} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function Page() {
  return (
    <ProtectedRoute>
      <MediaMTXDashboard />
    </ProtectedRoute>
  )
}
