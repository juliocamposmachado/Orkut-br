'use client';

import React, { useRef, useEffect } from 'react';
import { useStreamViewer, STREAM_QUALITIES } from '@/hooks/useStreamViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  Volume2, 
  VolumeX, 
  Settings,
  Signal,
  Activity,
  Loader2,
  AlertCircle,
  Tv,
  UserX,
  LogOut,
  Wifi,
  WifiOff
} from 'lucide-react';

interface StreamViewerProps {
  roomId: string;
  viewerId: string;
  viewerName: string;
  onLeaveRoom: () => void;
  preferredQuality?: keyof typeof STREAM_QUALITIES;
}

export default function StreamViewer({ 
  roomId, 
  viewerId, 
  viewerName, 
  onLeaveRoom,
  preferredQuality = 'medium'
}: StreamViewerProps) {
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isConnected,
    isConnecting,
    streamInfo,
    remoteStream,
    currentQuality,
    volume,
    isMuted,
    viewerStats,
    error,
    isKicked,
    joinStream,
    disconnect,
    changeQuality,
    setVolume,
    toggleMute,
  } = useStreamViewer({ roomId, viewerId, viewerName, preferredQuality });

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const getConnectionQualityColor = () => {
    switch (viewerStats.connectionQuality) {
      case 'excellent':
        return 'text-green-400';
      case 'good':
        return 'text-green-300';
      case 'fair':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      case 'disconnected':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getConnectionQualityIcon = () => {
    switch (viewerStats.connectionQuality) {
      case 'excellent':
      case 'good':
        return <Wifi className="w-4 h-4" />;
      case 'fair':
      case 'poor':
        return <Signal className="w-4 h-4" />;
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const formatBitrate = (bitrate: number) => {
    if (bitrate >= 1000) {
      return `${(bitrate / 1000).toFixed(1)}M`;
    }
    return `${bitrate}K`;
  };

  const getQualityColor = (quality: keyof typeof STREAM_QUALITIES) => {
    switch (quality) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Handle kicked state
  if (isKicked) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700 w-96">
          <CardContent className="p-8 text-center">
            <UserX className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Removed from Stream</h2>
            <p className="text-gray-400 mb-6">You have been removed from the stream by the host.</p>
            <Button onClick={onLeaveRoom} className="w-full">
              Return to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center">
              <Tv className="w-5 h-5 mr-2" />
              {streamInfo ? `${streamInfo.hostName}'s Stream` : 'Stream Viewer'}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {isConnected ? (
                <Badge className="bg-green-600 text-white">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-1" />
                    Connected
                  </div>
                </Badge>
              ) : isConnecting ? (
                <Badge className="bg-yellow-600 text-white">
                  <div className="flex items-center">
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Connecting
                  </div>
                </Badge>
              ) : (
                <Badge variant="secondary">Disconnected</Badge>
              )}
              
              {streamInfo?.isLive && (
                <Badge className="bg-red-600 text-white">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                    LIVE
                  </div>
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-1 ${getConnectionQualityColor()}`}>
            {getConnectionQualityIcon()}
            <span className="text-sm capitalize">{viewerStats.connectionQuality}</span>
          </div>
          
          <Button
            onClick={onLeaveRoom}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="m-4 border-red-600 bg-red-900/20 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex gap-4 p-4">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Video Player */}
          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardContent className="p-0 h-full">
              <div className="relative bg-black rounded-lg overflow-hidden h-full min-h-[400px]">
                {remoteStream && isConnected ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                          <p className="text-xl text-blue-400 mb-2">Connecting to stream...</p>
                          <p className="text-sm text-gray-400">Please wait while we establish connection</p>
                        </>
                      ) : !streamInfo?.isLive ? (
                        <>
                          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Tv className="w-12 h-12 text-gray-400" />
                          </div>
                          <p className="text-xl text-gray-400 mb-2">Stream Not Available</p>
                          <p className="text-sm text-gray-500 mb-4">The host hasn't started streaming yet</p>
                          {!isConnected && (
                            <Button onClick={joinStream} className="bg-blue-600 hover:bg-blue-700">
                              <Play className="w-4 h-4 mr-2" />
                              Join Stream
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-12 h-12 text-red-400" />
                          </div>
                          <p className="text-xl text-red-400 mb-2">Connection Failed</p>
                          <p className="text-sm text-gray-500 mb-4">Unable to connect to the stream</p>
                          <Button onClick={joinStream} variant="outline">
                            <Play className="w-4 h-4 mr-2" />
                            Try Again
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Stream Quality Indicator */}
                {isConnected && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-2 ${getQualityColor(currentQuality)}`} />
                      {currentQuality.toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Connection Quality Indicator */}
                {isConnected && (
                  <div className="absolute top-4 left-4">
                    <div className={`bg-black/75 backdrop-blur-sm px-3 py-1 rounded-full text-sm flex items-center ${getConnectionQualityColor()}`}>
                      {getConnectionQualityIcon()}
                      <span className="ml-1 capitalize">{viewerStats.connectionQuality}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Volume Controls */}
                <div className="flex items-center space-x-4 flex-1 max-w-md">
                  <Button
                    onClick={toggleMute}
                    variant={isMuted ? "destructive" : "default"}
                    size="sm"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <div className="flex-1">
                    <Slider
                      value={[volume * 100]}
                      onValueChange={(value) => setVolume(value[0] / 100)}
                      max={100}
                      step={1}
                      className="w-full"
                      disabled={isMuted}
                    />
                  </div>
                  
                  <span className="text-sm text-gray-400 w-8">
                    {Math.round(volume * 100)}%
                  </span>
                </div>

                {/* Quality Control */}
                <div className="flex items-center space-x-4">
                  <label className="text-white text-sm font-medium">Quality:</label>
                  <Select value={currentQuality} onValueChange={changeQuality} disabled={!isConnected}>
                    <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="low" className="text-white hover:bg-gray-600">
                        Low (360p)
                      </SelectItem>
                      <SelectItem value="medium" className="text-white hover:bg-gray-600">
                        Medium (720p)
                      </SelectItem>
                      <SelectItem value="high" className="text-white hover:bg-gray-600">
                        High (1080p)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Connection Controls */}
                <div className="flex items-center space-x-2">
                  {isConnected ? (
                    <Button onClick={disconnect} variant="outline" size="sm">
                      <Square className="w-4 h-4 mr-2" />
                      Disconnect
                    </Button>
                  ) : (
                    <Button onClick={joinStream} className="bg-blue-600 hover:bg-blue-700" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      {isConnecting ? 'Connecting...' : 'Connect'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Stream Info */}
          {streamInfo && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Tv className="w-5 h-5 mr-2" />
                  Stream Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Host:</span>
                  <span className="text-white font-medium">{streamInfo.hostName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  {streamInfo.isLive ? (
                    <Badge className="bg-red-600 text-white">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                        LIVE
                      </div>
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Offline</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Room ID:</span>
                  <span className="text-white font-mono text-sm">{roomId}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection Statistics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Connection Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{formatBitrate(viewerStats.bitrate)}</div>
                  <div className="text-xs text-gray-400">Bitrate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{viewerStats.fps}</div>
                  <div className="text-xs text-gray-400">FPS</div>
                </div>
              </div>
              
              <div className="text-center pt-2 border-t border-gray-700">
                <div className="text-sm font-medium text-white">{viewerStats.resolution || 'N/A'}</div>
                <div className="text-xs text-gray-400">Resolution</div>
              </div>
              
              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Connection:</span>
                  <div className={`flex items-center space-x-1 ${getConnectionQualityColor()}`}>
                    {getConnectionQualityIcon()}
                    <span className="text-sm capitalize">{viewerStats.connectionQuality}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Buffer Health:</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${viewerStats.bufferHealth}%` }}
                      />
                    </div>
                    <span className="text-sm text-white">{viewerStats.bufferHealth}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Audio Volume</label>
                <div className="flex items-center space-x-2">
                  <VolumeX className="w-4 h-4 text-gray-400" />
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(value) => setVolume(value[0] / 100)}
                    max={100}
                    step={1}
                    className="flex-1"
                    disabled={isMuted}
                  />
                  <Volume2 className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500">
                  Current: {Math.round(volume * 100)}% {isMuted ? '(Muted)' : ''}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                <span className="text-sm text-gray-400">Auto-reconnect</span>
                <Badge variant="secondary" className="text-xs">
                  Enabled
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
