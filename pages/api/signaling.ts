import { NextApiRequest, NextApiResponse } from 'next'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

// Estender tipos do Next.js para incluir socket.io
interface SocketServer extends HTTPServer {
  io?: SocketIOServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: NextApiResponse['socket'] & {
    server: SocketServer
  }
}

// Armazenar usuários conectados
const connectedUsers = new Map()
const userSockets = new Map()

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  // Se já existe um servidor Socket.IO, não criar outro
  if (res.socket.server.io) {
    console.log('Socket.IO server já existe')
    res.end()
    return
  }

  console.log('🚀 Inicializando servidor Socket.IO...')

  // Criar servidor Socket.IO
  const io = new SocketIOServer(res.socket.server, {
    path: '/api/signaling',
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  // Anexar ao servidor HTTP
  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log(`👤 Usuário conectado: ${socket.id}`)

    // Usuário se junta ao sistema
    socket.on('join', (userData) => {
      const { userId, userName } = userData
      
      console.log(`📝 Usuário ${userName} (${userId}) entrou`)
      
      // Armazenar informações do usuário
      connectedUsers.set(userId, {
        socketId: socket.id,
        userName,
        isOnline: true,
        lastSeen: new Date()
      })
      
      userSockets.set(socket.id, userId)
      
      // Notificar outros usuários
      socket.broadcast.emit('user-online', {
        userId,
        userName,
        isOnline: true
      })
      
      // Enviar lista de usuários online
      const onlineUsers = Array.from(connectedUsers.entries())
        .filter(([id]) => id !== userId)
        .map(([id, data]) => ({
          userId: id,
          userName: data.userName,
          isOnline: data.isOnline
        }))
      
      socket.emit('online-users', onlineUsers)
    })

    // Chamadas WebRTC
    socket.on('call-user', (data) => {
      const { to, type, offer } = data
      const fromUserId = userSockets.get(socket.id)
      const fromUser = connectedUsers.get(fromUserId)
      const toUser = connectedUsers.get(to)
      
      console.log(`📞 Chamada de ${fromUser?.userName} para ${toUser?.userName}`)
      
      if (toUser?.isOnline) {
        const toSocket = io.sockets.sockets.get(toUser.socketId)
        
        if (toSocket) {
          toSocket.emit('incoming-call', {
            from: fromUserId,
            fromName: fromUser?.userName,
            type,
            offer
          })
        }
      } else {
        socket.emit('call-failed', {
          reason: 'Usuário não está online'
        })
      }
    })

    // Responder chamada
    socket.on('answer-call', (data) => {
      const { to, accepted, answer } = data
      const fromUserId = userSockets.get(socket.id)
      const toUser = connectedUsers.get(to)
      
      if (toUser?.isOnline) {
        const toSocket = io.sockets.sockets.get(toUser.socketId)
        
        if (toSocket) {
          toSocket.emit(accepted ? 'call-answered' : 'call-rejected', {
            accepted,
            answer,
            from: fromUserId
          })
        }
      }
    })

    // WebRTC signaling
    socket.on('offer', (data) => {
      const { to, offer } = data
      const fromUserId = userSockets.get(socket.id)
      const toUser = connectedUsers.get(to)
      
      if (toUser?.isOnline) {
        const toSocket = io.sockets.sockets.get(toUser.socketId)
        if (toSocket) {
          toSocket.emit('offer', { offer, from: fromUserId })
        }
      }
    })

    socket.on('answer', (data) => {
      const { to, answer } = data
      const fromUserId = userSockets.get(socket.id)
      const toUser = connectedUsers.get(to)
      
      if (toUser?.isOnline) {
        const toSocket = io.sockets.sockets.get(toUser.socketId)
        if (toSocket) {
          toSocket.emit('answer', { answer, from: fromUserId })
        }
      }
    })

    socket.on('ice-candidate', (data) => {
      const { to, candidate } = data
      const fromUserId = userSockets.get(socket.id)
      const toUser = connectedUsers.get(to)
      
      if (toUser?.isOnline) {
        const toSocket = io.sockets.sockets.get(toUser.socketId)
        if (toSocket) {
          toSocket.emit('ice-candidate', { candidate, from: fromUserId })
        }
      }
    })

    // Encerrar chamada
    socket.on('end-call', (data) => {
      const { to } = data || {}
      const fromUserId = userSockets.get(socket.id)
      
      if (to) {
        const toUser = connectedUsers.get(to)
        if (toUser?.isOnline) {
          const toSocket = io.sockets.sockets.get(toUser.socketId)
          if (toSocket) {
            toSocket.emit('call-ended', { from: fromUserId })
          }
        }
      }
    })

    // Atualizar status
    socket.on('update-presence', (data) => {
      const { status } = data
      const userId = userSockets.get(socket.id)
      const user = connectedUsers.get(userId)
      
      if (user) {
        user.status = status
        user.lastSeen = new Date()
        
        socket.broadcast.emit('user-status-changed', {
          userId,
          status,
          lastSeen: user.lastSeen
        })
      }
    })

    // Heartbeat
    socket.on('ping', () => {
      socket.emit('pong')
    })

    // Desconexão
    socket.on('disconnect', () => {
      const userId = userSockets.get(socket.id)
      
      if (userId) {
        const user = connectedUsers.get(userId)
        
        if (user) {
          user.isOnline = false
          user.lastSeen = new Date()
          
          console.log(`👋 Usuário ${user.userName} desconectado`)
          
          socket.broadcast.emit('user-offline', {
            userId,
            userName: user.userName,
            isOnline: false,
            lastSeen: user.lastSeen
          })
        }
        
        // Limpar após 30 segundos
        setTimeout(() => {
          connectedUsers.delete(userId)
          userSockets.delete(socket.id)
        }, 30000)
      }
      
      console.log(`🔌 Socket desconectado: ${socket.id}`)
    })
  })

  console.log('✅ Servidor Socket.IO iniciado com sucesso!')
  res.end()
}
