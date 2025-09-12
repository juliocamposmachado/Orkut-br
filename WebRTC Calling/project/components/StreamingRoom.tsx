'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StreamHost from './StreamHost';
import StreamViewer from './StreamViewer';
import MediaPermissionRequest from './MediaPermissionRequest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Copy, 
  Check, 
  AlertCircle, 
  Monitor, 
  Tv, 
  Settings,
  Info,
  Hash,
  User,
  Crown,
  Loader2
} from 'lucide-react';
import { STREAM_QUALITIES } from '@/hooks/useStreaming';

export type UserRole = 'host' | 'viewer';

interface StreamingRoomProps {
  initialRoomId?: string;
  initialUserId?: string;
  initialUserName?: string;
  initialRole?: UserRole;
}

interface RoomInfo {
  id: string;
  hostId: string;
  hostName: string;
  isActive: boolean;
  viewerCount: number;
  quality: keyof typeof STREAM_QUALITIES;
  createdAt: Date;
}

export default function StreamingRoom({
  initialRoomId,
  initialUserId,
  initialUserName,
  initialRole
}: StreamingRoomProps) {
  const router = useRouter();
  
  // Room state
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [userId] = useState(initialUserId || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [userName, setUserName] = useState(initialUserName || '');
  const [userRole, setUserRole] = useState<UserRole>(initialRole || 'viewer');
  const [preferredQuality, setPreferredQuality] = useState<keyof typeof STREAM_QUALITIES>('medium');
  
  // UI state
  const [isJoined, setIsJoined] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

  // Auto-join if all initial props are provided
  useEffect(() => {
    if (initialRoomId && initialUserId && initialUserName && initialRole) {
      setIsJoined(true);
    }
  }, [initialRoomId, initialUserId, initialUserName, initialRole]);

  const generateRoomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const createRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    const newRoomId = generateRoomId();
    setRoomId(newRoomId);
    setUserRole('host');
    setError(null);
  };

  const joinRoom = async () => {
    if (!roomId.trim()) {
      setError('Please enter a room ID');
      return;
    }

    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Simulate room validation (in real app, you'd validate with your backend)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsJoined(true);
      
      // Update URL without refresh
      const url = new URL(window.location.href);
      url.searchParams.set('roomId', roomId);
      url.searchParams.set('userId', userId);
      url.searchParams.set('userName', userName);
      url.searchParams.set('role', userRole);
      window.history.replaceState({}, '', url.toString());
      
    } catch (err) {
      setError('Failed to join room. Please check the room ID and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const leaveRoom = () => {
    setIsJoined(false);
    setRoomInfo(null);
    
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('roomId');
    url.searchParams.delete('userId');
    url.searchParams.delete('userName');
    url.searchParams.delete('role');
    window.history.replaceState({}, '', url.toString());
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room ID:', err);
    }
  };

  const copyRoomUrl = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('roomId', roomId);
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy room URL:', err);
    }
  };

  // If already joined, render the appropriate interface
  if (isJoined) {
    if (userRole === 'host') {
      return (
        <StreamHost
          roomId={roomId}
          hostId={userId}
          hostName={userName}
          onLeaveRoom={leaveRoom}
        />
      );
    } else {
      return (
        <StreamViewer
          roomId={roomId}
          viewerId={userId}
          viewerName={userName}
          onLeaveRoom={leaveRoom}
          preferredQuality={preferredQuality}
        />
      );
    }
  }

  // Render lobby interface
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <Monitor className="w-10 h-10 mr-3" />
            Stream Room
          </h1>
          <p className="text-gray-400 text-lg">
            Create or join a live streaming session
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Room */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Create Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="host-name" className="text-gray-300">
                  Your Name
                </Label>
                <Input
                  id="host-name"
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Default Stream Quality</Label>
                <Select value={preferredQuality} onValueChange={setPreferredQuality}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="low" className="text-white hover:bg-gray-600">
                      Low (360p) - Better for slow connections
                    </SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-gray-600">
                      Medium (720p) - Balanced quality
                    </SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-gray-600">
                      High (1080p) - Best quality
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={createRoom}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Create & Host Room
              </Button>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <Info className="w-4 h-4" />
                  <span>You'll be the host and can stream to others</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Join Room */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Join Room
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="viewer-name" className="text-gray-300">
                  Your Name
                </Label>
                <Input
                  id="viewer-name"
                  type="text"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-id" className="text-gray-300">
                  Room ID
                </Label>
                <Input
                  id="room-id"
                  type="text"
                  placeholder="Enter 8-character room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Preferred Quality</Label>
                <Select value={preferredQuality} onValueChange={setPreferredQuality}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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

              <Button 
                onClick={joinRoom}
                disabled={isJoining}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Tv className="w-5 h-5 mr-2" />
                    Join as Viewer
                  </>
                )}
              </Button>

              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <Info className="w-4 h-4" />
                  <span>You'll watch the host's stream</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Room ID Display (when created) */}
        {roomId && userRole === 'host' && !isJoined && (
          <Card className="bg-gray-800 border-gray-700 mt-6">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Your Room Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Room ID</div>
                <div className="flex items-center justify-center space-x-2">
                  <code className="text-3xl font-bold text-white font-mono bg-gray-700 px-4 py-2 rounded-lg">
                    {roomId}
                  </code>
                  <Button
                    onClick={copyRoomId}
                    variant="outline"
                    size="sm"
                    className="border-gray-600"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={joinRoom}
                  disabled={isJoining}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Monitor className="w-4 h-4 mr-2" />
                      Start Hosting
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={copyRoomUrl}
                  variant="outline"
                  className="border-gray-600"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Room Link
                </Button>
              </div>

              <div className="text-center text-sm text-gray-400">
                Share this Room ID or link with people you want to watch your stream
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert className="mt-6 border-red-600 bg-red-900/20 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Features Info */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <Crown className="w-4 h-4 mr-2 text-yellow-400" />
                  For Hosts
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                    Live video & audio streaming
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                    Multiple quality options (360p-1080p)
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                    Real-time viewer statistics
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                    Viewer management & kick controls
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                    Audio/video mute controls
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-400" />
                  For Viewers
                </h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    High-quality video streaming
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    Adaptive quality selection
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    Volume & mute controls
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    Connection quality monitoring
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    Auto-reconnect on disconnection
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
