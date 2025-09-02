'use client'

export interface CallLog {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'success'
  category: 'api' | 'webrtc' | 'signaling' | 'media' | 'ui' | 'auth'
  message: string
  data?: any
  userId?: string
  callId?: string
}

class CallLogger {
  private logs: CallLog[] = []
  private maxLogs = 1000
  private isEnabled = true

  constructor() {
    // Carregar logs do localStorage se existirem
    if (typeof window !== 'undefined') {
      const savedLogs = localStorage.getItem('orkut-call-logs')
      if (savedLogs) {
        try {
          this.logs = JSON.parse(savedLogs).slice(-this.maxLogs)
        } catch (error) {
          console.warn('Erro ao carregar logs salvos:', error)
        }
      }
    }
  }

  private addLog(level: CallLog['level'], category: CallLog['category'], message: string, data?: any, userId?: string, callId?: string) {
    if (!this.isEnabled) return

    const logEntry: CallLog = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data: data ? (typeof data === 'object' ? JSON.stringify(data, null, 2) : data) : undefined,
      userId,
      callId
    }

    this.logs.push(logEntry)

    // Limitar número de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('orkut-call-logs', JSON.stringify(this.logs))
      } catch (error) {
        console.warn('Erro ao salvar logs:', error)
      }
    }

    // Console output com emojis e cores
    const emoji = {
      info: '📝',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[level]

    const color = {
      info: '#3B82F6',
      warn: '#F59E0B',
      error: '#EF4444',
      success: '#10B981'
    }[level]

    console.log(
      `%c${emoji} [${category.toUpperCase()}] ${message}`,
      `color: ${color}; font-weight: bold`,
      data || ''
    )
  }

  // Métodos principais de logging
  info(category: CallLog['category'], message: string, data?: any, userId?: string, callId?: string) {
    this.addLog('info', category, message, data, userId, callId)
  }

  success(category: CallLog['category'], message: string, data?: any, userId?: string, callId?: string) {
    this.addLog('success', category, message, data, userId, callId)
  }

  warn(category: CallLog['category'], message: string, data?: any, userId?: string, callId?: string) {
    this.addLog('warn', category, message, data, userId, callId)
  }

  error(category: CallLog['category'], message: string, data?: any, userId?: string, callId?: string) {
    this.addLog('error', category, message, data, userId, callId)
  }

  // Métodos específicos para categorias
  api(message: string, data?: any, userId?: string, callId?: string) {
    this.info('api', message, data, userId, callId)
  }

  webrtc(message: string, data?: any, userId?: string, callId?: string) {
    this.info('webrtc', message, data, userId, callId)
  }

  signaling(message: string, data?: any, userId?: string, callId?: string) {
    this.info('signaling', message, data, userId, callId)
  }

  media(message: string, data?: any, userId?: string, callId?: string) {
    this.info('media', message, data, userId, callId)
  }

  auth(message: string, data?: any, userId?: string) {
    this.info('auth', message, data, userId)
  }

  ui(message: string, data?: any, userId?: string, callId?: string) {
    this.info('ui', message, data, userId, callId)
  }

  // Utilitários
  getLogs(filter?: {
    level?: CallLog['level']
    category?: CallLog['category']
    userId?: string
    callId?: string
    limit?: number
  }): CallLog[] {
    let filteredLogs = [...this.logs]

    if (filter) {
      if (filter.level) {
        filteredLogs = filteredLogs.filter(log => log.level === filter.level)
      }
      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filter.category)
      }
      if (filter.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filter.userId)
      }
      if (filter.callId) {
        filteredLogs = filteredLogs.filter(log => log.callId === filter.callId)
      }
    }

    const limit = filter?.limit || 100
    return filteredLogs.slice(-limit)
  }

  getRecentErrors(limit = 10): CallLog[] {
    return this.logs
      .filter(log => log.level === 'error')
      .slice(-limit)
  }

  clearLogs() {
    this.logs = []
    if (typeof window !== 'undefined') {
      localStorage.removeItem('orkut-call-logs')
    }
    console.log('🗑️ Logs de chamadas limpos')
  }

  enable() {
    this.isEnabled = true
    console.log('📝 Logging de chamadas habilitado')
  }

  disable() {
    this.isEnabled = false
    console.log('🔇 Logging de chamadas desabilitado')
  }

  // Exportar logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Método para debug de WebRTC
  logWebRTCStats(peerConnection: RTCPeerConnection, callId?: string) {
    if (!peerConnection) return

    peerConnection.getStats().then(stats => {
      const statsData: any = {}
      
      stats.forEach((report, id) => {
        statsData[id] = {
          type: report.type,
          ...Object.fromEntries(Object.entries(report).filter(([key]) => 
            !['id', 'timestamp', 'type'].includes(key)
          ))
        }
      })

      this.webrtc('WebRTC Stats coletadas', {
        connectionState: peerConnection.connectionState,
        iceConnectionState: peerConnection.iceConnectionState,
        signalingState: peerConnection.signalingState,
        stats: statsData
      }, undefined, callId)
    }).catch(error => {
      this.error('webrtc', 'Erro ao coletar stats WebRTC', error, undefined, callId)
    })
  }

  // Método para monitorar eventos WebRTC
  monitorPeerConnection(peerConnection: RTCPeerConnection, callId?: string) {
    const events = [
      'connectionstatechange',
      'iceconnectionstatechange', 
      'icegatheringstatechange',
      'signalingstatechange',
      'track',
      'datachannel'
    ]

    events.forEach(eventName => {
      peerConnection.addEventListener(eventName, (event) => {
        this.webrtc(`WebRTC Event: ${eventName}`, {
          connectionState: peerConnection.connectionState,
          iceConnectionState: peerConnection.iceConnectionState,
          iceGatheringState: peerConnection.iceGatheringState,
          signalingState: peerConnection.signalingState,
          event: event.type
        }, undefined, callId)
      })
    })
  }
}

// Instância singleton
export const callLogger = new CallLogger()

// Função helper para logging rápido
export const logCall = callLogger
