# WebRTC Video Call Application

A complete peer-to-peer video calling application built with Next.js 14, TypeScript, and Supabase Realtime for signaling. This application enables high-quality audio and video calls directly between browsers without requiring a central media server.

## Features

- 🎥 **Peer-to-peer video calls** using WebRTC
- 🔊 **High-quality audio** with mute/unmute controls
- 📹 **HD video streaming** with camera on/off controls
- 🏠 **Room-based calling** with unique room IDs
- 🔄 **Real-time signaling** via Supabase Realtime
- 📱 **Responsive design** for desktop and mobile
- 🔒 **Secure communication** with STUN/TURN support
- ⚡ **No registration required** - instant calling

## Architecture Overview

The application implements WebRTC peer-to-peer communication with the following flow:

```
┌─────────────┐    Signaling via     ┌─────────────┐
│   User A    │    Supabase          │   User B    │
│  (Caller)   │◄──────────────────►│ (Receiver)  │
└─────────────┘                     └─────────────┘
       │                                   │
       │            Media Stream           │
       └─────────── WebRTC P2P ──────────┘
```

### Signaling Flow:

1. **User A** creates offer → `pc.createOffer()` → `pc.setLocalDescription(offer)`
2. **Offer sent** via Supabase channel → `channel.send('offer', offer)`
3. **User B** receives offer → `pc.setRemoteDescription(offer)` → captures media → `pc.createAnswer()`
4. **Answer sent** back → `pc.setLocalDescription(answer)` → `channel.send('answer', answer)`
5. **User A** receives answer → `pc.setRemoteDescription(answer)`
6. **ICE candidates** exchanged → `pc.onicecandidate` → `channel.send('ice-candidate', candidate)`
7. **Connection established** → `pc.ontrack` → remote video/audio streams connected

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase project (free tier works)

### Installation

1. **Clone and setup:**
```bash
git clone <repository-url>
cd webrtc-video-call
npm install
```

2. **Environment configuration:**
```bash
cp .env.example .env.local
```

3. **Configure Supabase in `.env.local`:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: TURN server for production (recommended)
# NEXT_PUBLIC_TURN_URL=turn:your-turn-server.com:3478
# NEXT_PUBLIC_TURN_USER=your_turn_username
# NEXT_PUBLIC_TURN_PASS=your_turn_password
```

4. **Run development server:**
```bash
npm run dev
```

5. **Open browser:**
Navigate to `http://localhost:3000`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Your Supabase anonymous/public key |
| `NEXT_PUBLIC_TURN_URL` | ❌ | TURN server URL for production |
| `NEXT_PUBLIC_TURN_USER` | ❌ | TURN server username |
| `NEXT_PUBLIC_TURN_PASS` | ❌ | TURN server password |

## Testing Instructions

### Manual Testing (5 Steps)

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Create a room:**
   - Open `http://localhost:3000`
   - Click "📹 Create New Room"
   - Copy the room URL from browser address bar

3. **Join from another browser/device:**
   - Open a new incognito window OR different browser OR different device
   - Navigate to the same room URL
   - Alternatively, use the room ID to join manually

4. **Initiate call:**
   - In the first browser: Click "📞 Start Call"
   - In the second browser: You should see "Incoming call" → Click "📞 Answer"
   - Wait for "Connected" status

5. **Test features:**
   - ✅ Video should appear in both windows
   - ✅ Audio should work (test speaking)
   - ✅ Test mute/unmute buttons
   - ✅ Test camera on/off
   - ✅ Test "Hang Up" - both sides should disconnect

### Expected Results:
- Console logs showing: Offer → Answer → ICE candidates exchange
- Both participants can see and hear each other
- Connection status changes: calling → connecting → connected
- Media controls work properly
- Clean disconnection when hanging up

## Production Deployment

### Vercel Deployment

1. **Push to GitHub/GitLab**

2. **Connect to Vercel:**
   - Import project in Vercel dashboard
   - Configure environment variables in Vercel settings
   - Deploy

3. **Environment Variables in Vercel:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### TURN Server Setup (Production)

For production environments with restrictive NATs, configure a TURN server:

#### Option 1: coturn (Self-hosted)
```bash
# Install coturn
sudo apt-get install coturn

# Basic configuration (/etc/turnserver.conf)
listening-port=3478
external-ip=YOUR_SERVER_IP
user=myuser:mypass
realm=myrealm
```

#### Option 2: Cloud TURN Services
- **Twilio STUN/TURN**: https://www.twilio.com/stun-turn
- **Xirsys**: https://xirsys.com/
- **Metered TURN**: https://www.metered.ca/tools/openrelay/

### Security Recommendations

1. **HTTPS Required:** WebRTC requires HTTPS in production (getUserMedia restriction)
2. **TURN Authentication:** Use time-limited credentials for TURN servers
3. **Room Access Control:** Consider implementing room passwords or user authentication
4. **Rate Limiting:** Implement signaling message rate limiting
5. **Message TTL:** Configure Supabase to clean up old signaling messages

## Project Structure

```
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Home page - create/join room
│   └── room/[roomId]/
│       └── page.tsx        # Room page - video call interface
├── components/
│   ├── VideoCall.tsx       # Main video call component
│   └── CallControls.tsx    # Call control buttons
├── hooks/
│   └── useWebRTC.ts        # WebRTC logic and Supabase signaling
├── lib/
│   └── webrtc.ts          # WebRTC configuration and types
├── utils/supabase/
│   ├── client.ts          # Supabase client (browser)
│   └── server.ts          # Supabase client (server)
└── README.md              # This file
```

## Key Components Explained

### `useWebRTC` Hook
- Manages WebRTC peer connection lifecycle
- Handles Supabase Realtime signaling
- Provides media controls and state management
- Implements offer/answer exchange and ICE candidate handling

### `VideoCall` Component
- Renders video elements and attaches media streams
- Manages local and remote video display
- Integrates with call controls

### `CallControls` Component
- Provides call action buttons (call, answer, reject, hangup)
- Media control buttons (mute audio, disable video)
- Adapts UI based on current call state

## Troubleshooting

### Common Issues

1. **Camera/Microphone Access Denied:**
   - Ensure HTTPS (required for getUserMedia)
   - Check browser permissions
   - Try refreshing and allowing permissions

2. **Connection Failed:**
   - Check Supabase configuration
   - Verify environment variables
   - Check browser console for detailed errors
   - For restrictive networks, configure TURN server

3. **No Audio/Video:**
   - Check media permissions
   - Verify media devices are available
   - Check if tracks are enabled
   - Test with different browsers

4. **Signaling Issues:**
   - Verify Supabase Realtime is enabled
   - Check Supabase project settings
   - Ensure anonymous access is allowed
   - Check network connectivity

### Browser Support

- ✅ Chrome 76+
- ✅ Firefox 72+
- ✅ Safari 14+
- ✅ Edge 79+
- ⚠️ Mobile browsers (iOS Safari 14.3+, Chrome Mobile)

### Mobile Considerations

- **iOS WebView:** May require additional configuration
- **Camera Permissions:** More strict on mobile browsers
- **Background Processing:** Calls may be interrupted when app goes to background
- **Landscape Mode:** Recommended for better video experience

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (include the 5-step testing process)
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify environment configuration
4. Test with the provided 5-step manual testing process

---

**Note:** This application prioritizes simplicity and functionality. For enterprise use, consider additional features like user authentication, room persistence, call recording, and advanced security measures.