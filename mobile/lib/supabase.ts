import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Configuração específica para mobile
export const mobileConfig = {
  // Configurações de media para chamadas
  mediaConstraints: {
    audio: true,
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 }
    }
  },
  
  // Configurações de notificação
  notificationConfig: {
    enableSound: true,
    enableVibration: true,
    enableBadge: true
  },
  
  // Configurações de performance
  performanceConfig: {
    enableHardwareAcceleration: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    enableOfflineMode: true
  }
};
