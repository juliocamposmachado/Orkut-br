# Diagnóstico do Sistema de Chamadas - Orkut BR

## ❌ Problemas Identificados

### 1. **Notificações Visuais Não Aparecem**
- **Hook de notificações** (`use-call-notifications.ts`): Configurado corretamente mas com problemas de timing
- **Filtros muito restritivos** nas linhas 103-110 rejeitam notificações válidas
- **Componente CallNotification** não está sendo renderizado devido a estados inconsistentes

### 2. **Notificações de Áudio Não Funcionam**
- **Arquivo de áudio não encontrado** - código tenta usar Web Audio API mas não há fallback
- **Permissões de áudio** não são solicitadas adequadamente
- **Sons não são reproduzidos** devido a políticas do navegador

### 3. **Página Não Atualiza Durante Chamadas**
- **Realtime subscriptions** podem estar perdendo conexão
- **Estados do React** não sincronizam adequadamente
- **Múltiplos listeners** podem causar conflitos

### 4. **Problemas de Conectividade WebRTC**
- **ICE candidates** não estão sendo processados corretamente
- **STUN/TURN servers** podem estar inacessíveis
- **Firewall/NAT** pode bloquear conexões P2P

## 🔧 Soluções Propostas

### 1. **Corrigir Sistema de Notificações**

#### Problema: Filtros muito restritivos
```typescript
// ANTES (linha 103 em use-call-notifications.ts):
if (notificationTime >= startTime && timeDiff <= 10) {

// SOLUÇÃO: Aumentar tolerância e melhorar lógica
if (notificationTime >= startTime && timeDiff <= 30) {
  // Processar chamada
} else if (timeDiff <= 60) {
  // Mostrar como chamada perdida
}
```

#### Problema: Estados inconsistentes
```typescript
// Adicionar logs detalhados e garantir consistência
useEffect(() => {
  console.log('🎦 Estados atuais:', { incomingCall, isRinging, isInCall })
}, [incomingCall, isRinging, isInCall])
```

### 2. **Implementar Notificações de Áudio**

#### Criar arquivo de som de toque
```typescript
// Adicionar arquivos de áudio na pasta public/sounds/
const ringtoneAudio = new Audio('/sounds/incoming-call.mp3')
const callEndAudio = new Audio('/sounds/call-end.mp3')

// Implementar reprodução com tratamento de erros
const playRingtone = async () => {
  try {
    await ringtoneAudio.play()
  } catch (error) {
    console.warn('Não foi possível reproduzir áudio:', error)
    // Usar Web Audio API como fallback
    playBeepSound()
  }
}
```

### 3. **Melhorar Realtime Subscriptions**

#### Implementar reconexão automática
```typescript
const setupRealtimeListener = () => {
  const channel = supabase
    .channel(`call_notifications_${user.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `profile_id=eq.${user.id}`
    }, handleNotification)
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR') {
        // Reconectar após delay
        setTimeout(setupRealtimeListener, 2000)
      }
    })
}
```

### 4. **Corrigir WebRTC Manager**

#### Melhorar handling de ICE candidates
```typescript
// No WebRTCManager, adicionar buffer para ICE candidates
private iceCandidateBuffer: RTCIceCandidateInit[] = []

async addIceCandidate(candidate: RTCIceCandidateInit) {
  if (!this.peerConnection || !this.peerConnection.remoteDescription) {
    // Armazenar para processar depois
    this.iceCandidateBuffer.push(candidate)
    return
  }
  
  await this.peerConnection.addIceCandidate(candidate)
}

// Processar buffer quando remote description estiver definida
private async processPendingIceCandidates() {
  for (const candidate of this.iceCandidateBuffer) {
    await this.addIceCandidate(candidate)
  }
  this.iceCandidateBuffer = []
}
```

## 🔍 Verificações Necessárias

### 1. **Banco de Dados**
Confirmar se estas tabelas existem no Supabase:

```sql
-- Tabela de notificações
SELECT * FROM notifications WHERE type = 'incoming_call' LIMIT 5;

-- Tabela de sinais WebRTC
SELECT * FROM call_signals LIMIT 5;

-- Tabela de presença de usuários
SELECT * FROM user_presence WHERE is_online = true LIMIT 5;
```

### 2. **Permissões do Navegador**
```typescript
// Verificar e solicitar permissões
const checkPermissions = async () => {
  try {
    // Microfone
    const audioPermission = await navigator.permissions.query({ name: 'microphone' })
    
    // Câmera (se vídeo)
    const videoPermission = await navigator.permissions.query({ name: 'camera' })
    
    // Notificações
    const notificationPermission = await Notification.requestPermission()
    
    console.log('Permissões:', { audioPermission, videoPermission, notificationPermission })
  } catch (error) {
    console.error('Erro ao verificar permissões:', error)
  }
}
```

### 3. **Conectividade de Rede**
```typescript
// Testar STUN servers
const testStunConnectivity = async () => {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  })
  
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('✅ ICE candidate gerado:', event.candidate.type)
    }
  }
  
  // Criar offer para iniciar coleta de candidates
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
}
```

## 🚀 Implementação Prioritária

### 1. **Imediata (Alta Prioridade)**
- ✅ Corrigir filtros de tempo nas notificações
- ✅ Adicionar logs detalhados para debug
- ✅ Implementar áudio de toque básico

### 2. **Curto Prazo (Média Prioridade)**
- ⏳ Melhorar interface de chamada recebida
- ⏳ Implementar reconexão automática do Realtime
- ⏳ Adicionar verificação de permissões

### 3. **Longo Prazo (Baixa Prioridade)**
- 🔄 Implementar TURN server próprio
- 🔄 Adicionar histórico completo de chamadas
- 🔄 Implementar chamadas em grupo

## 📊 Métricas de Monitoramento

Para acompanhar melhorias:

```typescript
// Adicionar métricas de performance
const callMetrics = {
  notificationReceived: Date.now(),
  userResponse: null,
  webrtcConnected: null,
  callQuality: {
    audio: 'good' | 'poor' | 'failed',
    video: 'good' | 'poor' | 'failed'
  }
}

// Enviar para analytics
const trackCallMetric = (event: string, data: any) => {
  console.log('📊 Call Metric:', event, data)
  // Integrar com serviço de analytics futuramente
}
```

## 🔧 Scripts de Debug

### Teste de Notificações
```typescript
// Executar no console do navegador
const testNotification = async () => {
  // Simular notificação de chamada
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      profile_id: 'USER_ID_AQUI',
      type: 'incoming_call',
      payload: {
        call_id: 'test_call_123',
        call_type: 'audio',
        from_user: {
          id: 'caller_id',
          username: 'testuser',
          display_name: 'Usuário Teste',
          photo_url: null
        },
        timestamp: new Date().toISOString()
      },
      read: false
    })
  
  console.log('Notificação de teste criada:', { data, error })
}
```

### Teste de WebRTC
```typescript
// Verificar capacidades WebRTC
const testWebRTCCapabilities = () => {
  console.log('📡 WebRTC Support:', {
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
    RTCPeerConnection: !!window.RTCPeerConnection,
    webkitRTCPeerConnection: !!(window as any).webkitRTCPeerConnection,
    mozRTCPeerConnection: !!(window as any).mozRTCPeerConnection
  })
}
```

---

**Próximos Passos:**
1. ✅ Implementar correções de alta prioridade
2. 🔍 Executar testes de verificação
3. 📊 Monitorar métricas de performance
4. 🔄 Iterar baseado no feedback dos usuários
