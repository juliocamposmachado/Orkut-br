// Sons em base64 para usar quando não há arquivos externos
// Estes são sons muito simples para fallback

export const SOUND_ASSETS = {
  // Som simples de sino (440Hz por 0.5s)
  bell: 'data:audio/wav;base64,UklGRlQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAEAAC...',
  
  // Som de notificação (sequência de tons)
  notification: 'data:audio/wav;base64,UklGRlQEAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAEAAC...'
};

// URLs para sons reais (quando disponíveis)
export const SOUND_URLS = {
  msn_message: '/sounds/msn-message.mp3',
  msn_nudge: '/sounds/msn-nudge.mp3', 
  msn_online: '/sounds/msn-online.mp3',
  msn_offline: '/sounds/msn-offline.mp3',
  msn_error: '/sounds/msn-error.mp3',
  notification_bell: '/sounds/notification-bell.mp3'
};

// Verificar se arquivo de som existe
export const checkSoundFile = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};
