'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, 
  Mic, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  Chrome,
  Globe,
  Monitor
} from 'lucide-react';

interface MediaPermissionRequestProps {
  onPermissionsGranted: (permissions: { video: boolean; audio: boolean }) => void;
  onCancel?: () => void;
}

export default function MediaPermissionRequest({ onPermissionsGranted, onCancel }: MediaPermissionRequestProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<{
    video: 'unknown' | 'granted' | 'denied';
    audio: 'unknown' | 'granted' | 'denied';
  }>({
    video: 'unknown',
    audio: 'unknown'
  });

  const checkBrowserSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        supported: false,
        reason: 'WebRTC não é suportado neste navegador'
      };
    }

    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      return {
        supported: false,
        reason: 'WebRTC requer HTTPS ou localhost para funcionar'
      };
    }

    return { supported: true };
  }, []);

  const requestPermissions = useCallback(async () => {
    setIsRequesting(true);
    setError(null);

    try {
      const browserCheck = checkBrowserSupport();
      if (!browserCheck.supported) {
        throw new Error(browserCheck.reason);
      }

      console.log('🔐 Solicitando permissões de mídia...');

      // Request camera and microphone permissions
      let videoGranted = false;
      let audioGranted = false;
      let stream: MediaStream | null = null;

      try {
        // Try to get both video and audio
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user' }, 
          audio: true 
        });
        
        videoGranted = stream.getVideoTracks().length > 0;
        audioGranted = stream.getAudioTracks().length > 0;
        
        console.log('✅ Permissões obtidas:', { video: videoGranted, audio: audioGranted });
      } catch (bothError) {
        console.warn('⚠️ Não foi possível obter ambas as permissões, tentando separadamente...');
        
        // Try video only
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          videoGranted = true;
          if (stream) {
            videoStream.getTracks().forEach(track => stream!.addTrack(track));
          } else {
            stream = videoStream;
          }
          console.log('✅ Permissão de vídeo obtida');
        } catch (videoError) {
          console.warn('❌ Permissão de vídeo negada:', videoError);
        }

        // Try audio only
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          audioGranted = true;
          if (stream) {
            audioStream.getTracks().forEach(track => stream!.addTrack(track));
          } else {
            stream = audioStream;
          }
          console.log('✅ Permissão de áudio obtida');
        } catch (audioError) {
          console.warn('❌ Permissão de áudio negada:', audioError);
        }
      }

      // Update permission status
      setPermissionStatus({
        video: videoGranted ? 'granted' : 'denied',
        audio: audioGranted ? 'granted' : 'denied'
      });

      // Stop the test stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      if (!videoGranted && !audioGranted) {
        throw new Error('Nenhuma permissão foi concedida. Verifique as configurações do navegador.');
      }

      // Call success callback
      onPermissionsGranted({ 
        video: videoGranted, 
        audio: audioGranted 
      });

    } catch (err) {
      console.error('❌ Erro ao solicitar permissões:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao solicitar permissões';
      setError(errorMessage);
    } finally {
      setIsRequesting(false);
    }
  }, [checkBrowserSupport, onPermissionsGranted]);

  const getErrorHelp = (error: string) => {
    if (error.includes('Permission denied') || error.includes('NotAllowedError')) {
      return {
        title: 'Permissão Negada',
        message: 'Você precisa permitir o acesso à câmera e microfone para fazer streaming.',
        steps: [
          'Clique no ícone de câmera/microfone na barra de endereços',
          'Selecione "Permitir" para câmera e microfone',
          'Recarregue a página se necessário'
        ]
      };
    }
    
    if (error.includes('NotFoundError') || error.includes('DeviceNotFoundError')) {
      return {
        title: 'Dispositivos Não Encontrados',
        message: 'Não foi possível encontrar câmera ou microfone no seu dispositivo.',
        steps: [
          'Verifique se sua câmera e microfone estão conectados',
          'Certifique-se de que não estão sendo usados por outros aplicativos',
          'Tente reiniciar o navegador'
        ]
      };
    }

    if (error.includes('HTTPS') || error.includes('localhost')) {
      return {
        title: 'Conexão Não Segura',
        message: 'WebRTC requer uma conexão segura (HTTPS) para funcionar.',
        steps: [
          'Acesse o site usando HTTPS',
          'Ou teste em localhost para desenvolvimento',
          'Verifique se há um certificado SSL válido'
        ]
      };
    }

    return {
      title: 'Erro Desconhecido',
      message: error,
      steps: [
        'Tente recarregar a página',
        'Verifique se o navegador suporta WebRTC',
        'Teste em um navegador diferente'
      ]
    };
  };

  const browserSupport = checkBrowserSupport();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-white text-xl">Permissões de Mídia</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!browserSupport.supported ? (
            <Alert className="border-red-600 bg-red-900/20 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                {browserSupport.reason}
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-gray-300 text-sm text-center">
                Para fazer streaming, precisamos acessar sua câmera e microfone.
              </p>

              {/* Permission Status */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div className="flex items-center space-x-2">
                    <Camera className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Câmera</span>
                  </div>
                  {permissionStatus.video === 'granted' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {permissionStatus.video === 'denied' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-2 bg-gray-700 rounded">
                  <div className="flex items-center space-x-2">
                    <Mic className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Microfone</span>
                  </div>
                  {permissionStatus.audio === 'granted' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {permissionStatus.audio === 'denied' && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
              </div>

              {error && (
                <Alert className="border-red-600 bg-red-900/20 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">{getErrorHelp(error).title}</div>
                      <div className="text-sm">{getErrorHelp(error).message}</div>
                      <ul className="text-xs space-y-1 mt-2">
                        {getErrorHelp(error).steps.map((step, index) => (
                          <li key={index} className="flex items-start space-x-1">
                            <span className="text-red-300">{index + 1}.</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={requestPermissions}
                  disabled={isRequesting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isRequesting ? 'Solicitando...' : 'Permitir Acesso'}
                </Button>
                
                {onCancel && (
                  <Button 
                    onClick={onCancel}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    Cancelar
                  </Button>
                )}
              </div>

              {/* Browser Tips */}
              <div className="pt-4 border-t border-gray-700">
                <div className="text-xs text-gray-400 text-center">
                  <div className="font-medium mb-2">Navegadores Suportados:</div>
                  <div className="flex justify-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Chrome className="w-3 h-3" />
                      <span>Chrome</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Monitor className="w-3 h-3" />
                      <span>Firefox</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Globe className="w-3 h-3" />
                      <span>Safari</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
