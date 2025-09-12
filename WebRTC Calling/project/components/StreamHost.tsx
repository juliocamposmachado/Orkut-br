'use client';

import React, { useRef, useEffect } from 'react';
import { useStreaming, STREAM_QUALITIES, type Viewer } from '@/hooks/useStreaming';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Square, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Users, 
  Settings,
  Eye,
  Clock,
  Activity,
  Signal,
  UserX,
  Monitor
} from 'lucide-react';

interface StreamHostProps {
  roomId: string;
  hostId: string;
  hostName: string;
  onLeaveRoom: () => void;
}

export default function StreamHost({ roomId, hostId, hostName, onLeaveRoom }: StreamHostProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const {
    isStreaming,
    streamQuality,
    isAudioEnabled,
    isVideoEnabled,
    viewers,
    streamStats,
    error,
    localStream,
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo,
    changeQuality,
    kickViewer,
  } = useStreaming({ roomId, hostId, hostName });

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBitrate = (bitrate: number) => {
    if (bitrate >= 1000000) {
      return `${(bitrate / 1000000).toFixed(1)}M`;
    }
    return `${(bitrate / 1000).toFixed(0)}K`;
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

  const formatViewerJoinTime = (joinedAt: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - joinedAt.getTime()) / 1000);
    
    if (diff < 60) {
      return `${diff}s ago`;
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    }
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-white flex items-center">
              <Monitor className="w-5 h-5 mr-2" />
              Stream Host - {roomId}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              {isStreaming ? (
                <Badge className="bg-red-600 text-white">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                    LIVE
                  </div>
                </Badge>
              ) : (
                <Badge variant="secondary">Offline</Badge>
              )}
              <span className="text-sm text-gray-300">
                {viewers.length} {viewers.length === 1 ? 'viewer' : 'viewers'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            onClick={onLeaveRoom}
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
          >
            Leave Room
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="m-4 border-red-600 bg-red-900/20 text-red-400">
          <AlertDescription>
            Error: {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex-1 flex gap-4 p-4">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col space-y-4">
          {/* Video Preview */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-0">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                {localStream && isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                      <p className="text-lg text-gray-400">
                        {!isVideoEnabled ? 'Camera Off' : 'No Video'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Stream Status Overlay */}
                <div className="absolute top-4 left-4">
                  {isStreaming && (
                    <div className="bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
                      STREAMING
                    </div>
                  )}
                </div>

                {/* Quality Indicator */}
                <div className="absolute top-4 right-4">
                  <div className="bg-black/75 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getQualityColor(streamQuality)}`} />
                    {streamQuality.toUpperCase()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stream Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Stream Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Controls */}
              <div className="flex items-center justify-center space-x-4">
                {!isStreaming ? (
                  <Button
                    onClick={startStream}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                    size="lg"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Stream
                  </Button>
                ) : (
                  <Button
                    onClick={stopStream}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3"
                    size="lg"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Stop Stream
                  </Button>
                )}
                
                <Button
                  onClick={toggleAudio}
                  variant={isAudioEnabled ? "default" : "destructive"}
                  size="lg"
                  className="px-6"
                >
                  {isAudioEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </Button>
                
                <Button
                  onClick={toggleVideo}
                  variant={isVideoEnabled ? "default" : "destructive"}
                  size="lg"
                  className="px-6"
                >
                  {isVideoEnabled ? (
                    <Video className="w-5 h-5" />
                  ) : (
                    <VideoOff className="w-5 h-5" />
                  )}
                </Button>
              </div>

              {/* Quality Control */}
              <div className="flex items-center justify-center space-x-4">
                <label className="text-white text-sm font-medium">Quality:</label>
                <Select value={streamQuality} onValueChange={changeQuality}>
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
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-80 space-y-4">
          {/* Stream Statistics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Stream Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{streamStats.viewers}</div>
                  <div className="text-sm text-gray-400">Viewers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{formatUptime(streamStats.uptime)}</div>
                  <div className="text-sm text-gray-400">Uptime</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{formatBitrate(streamStats.bitrate)}</div>
                  <div className="text-xs text-gray-400">Bitrate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-white">{streamStats.fps}</div>
                  <div className="text-xs text-gray-400">FPS</div>
                </div>
              </div>
              
              <div className="text-center pt-2 border-t border-gray-700">
                <div className="text-sm font-medium text-white">{streamStats.resolution}</div>
                <div className="text-xs text-gray-400">Resolution</div>
              </div>
            </CardContent>
          </Card>

          {/* Viewers List */}
          <Card className="bg-gray-800 border-gray-700 flex-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Viewers ({viewers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewers.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">No viewers yet</p>
                  <p className="text-gray-500 text-xs mt-1">Share your room ID to invite people</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {viewers.map((viewer) => (
                    <div
                      key={viewer.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">
                          {viewer.name}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{formatViewerJoinTime(viewer.joinedAt)}</span>
                          <div className={`w-2 h-2 rounded-full ${getQualityColor(viewer.quality)}`} />
                          <span>{viewer.quality}</span>
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => kickViewer(viewer.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
