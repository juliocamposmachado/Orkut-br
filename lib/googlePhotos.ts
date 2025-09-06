/**
 * Google Photos API Integration
 * Permite upload e gestão de fotos no Google Photos do usuário
 */

interface GooglePhotosConfig {
  apiKey?: string;
  accessToken: string;
}

interface PhotoUploadResult {
  success: boolean;
  mediaItem?: GoogleMediaItem;
  error?: string;
}

interface GoogleMediaItem {
  id: string;
  productUrl: string;
  baseUrl: string;
  mimeType: string;
  mediaMetadata: {
    creationTime: string;
    width: string;
    height: string;
  };
  filename: string;
}

interface GooglePhotosAlbum {
  id: string;
  title: string;
  productUrl: string;
  mediaItemsCount: string;
  coverPhotoBaseUrl: string;
}

export class GooglePhotosService {
  private accessToken: string;
  private baseUrl = 'https://photoslibrary.googleapis.com/v1';

  constructor(config: GooglePhotosConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Cria um álbum no Google Photos para organizar fotos do Orkut
   */
  async createOrkutAlbum(): Promise<GooglePhotosAlbum | null> {
    try {
      const response = await fetch(`${this.baseUrl}/albums`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          album: {
            title: 'Orkut Photos 📸',
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao criar álbum: ${response.statusText}`);
      }

      const album = await response.json();
      console.log('✅ Álbum Orkut criado:', album.title);
      return album;
    } catch (error) {
      console.error('❌ Erro ao criar álbum Orkut:', error);
      return null;
    }
  }

  /**
   * Busca o álbum do Orkut ou cria se não existir
   */
  async getOrCreateOrkutAlbum(): Promise<GooglePhotosAlbum | null> {
    try {
      // Buscar álbum existente
      const response = await fetch(`${this.baseUrl}/albums`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const orkutAlbum = data.albums?.find((album: GooglePhotosAlbum) => 
          album.title.includes('Orkut Photos')
        );

        if (orkutAlbum) {
          console.log('📸 Álbum Orkut encontrado:', orkutAlbum.title);
          return orkutAlbum;
        }
      }

      // Criar novo álbum se não encontrou
      return await this.createOrkutAlbum();
    } catch (error) {
      console.error('❌ Erro ao buscar/criar álbum:', error);
      return null;
    }
  }

  /**
   * Faz upload de uma foto para o Google Photos
   */
  async uploadPhoto(
    photoFile: File,
    albumId?: string,
    description?: string
  ): Promise<PhotoUploadResult> {
    try {
      console.log('📤 Iniciando upload para Google Photos:', photoFile.name);

      // Passo 1: Upload do arquivo bruto
      const uploadToken = await this.uploadRawBytes(photoFile);
      if (!uploadToken) {
        throw new Error('Falha no upload dos bytes');
      }

      // Passo 2: Criar item de mídia
      const mediaItem = await this.createMediaItem(uploadToken, photoFile.name, description);
      if (!mediaItem) {
        throw new Error('Falha ao criar item de mídia');
      }

      // Passo 3: Adicionar ao álbum (opcional)
      if (albumId) {
        await this.addToAlbum(albumId, mediaItem.id);
      }

      console.log('✅ Upload concluído:', mediaItem.filename);
      return {
        success: true,
        mediaItem,
      };
    } catch (error) {
      console.error('❌ Erro no upload:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Upload dos bytes da foto
   */
  private async uploadRawBytes(file: File): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/uploads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'X-Goog-Upload-Content-Type': file.type,
          'X-Goog-Upload-Protocol': 'raw',
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload falhou: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('❌ Erro no upload de bytes:', error);
      return null;
    }
  }

  /**
   * Cria item de mídia no Google Photos
   */
  private async createMediaItem(
    uploadToken: string,
    filename: string,
    description?: string
  ): Promise<GoogleMediaItem | null> {
    try {
      const response = await fetch(`${this.baseUrl}/mediaItems:batchCreate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newMediaItems: [
            {
              description: description || `Foto enviada via Orkut: ${filename}`,
              simpleMediaItem: {
                uploadToken,
                fileName: filename,
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Criação do item falhou: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.newMediaItemResults?.[0]?.status?.message === 'Success') {
        return result.newMediaItemResults[0].mediaItem;
      } else {
        throw new Error(`Erro na criação: ${result.newMediaItemResults?.[0]?.status?.message}`);
      }
    } catch (error) {
      console.error('❌ Erro ao criar item de mídia:', error);
      return null;
    }
  }

  /**
   * Adiciona foto ao álbum
   */
  private async addToAlbum(albumId: string, mediaItemId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/albums/${albumId}:batchAddMediaItems`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaItemIds: [mediaItemId],
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Erro ao adicionar ao álbum:', error);
      return false;
    }
  }

  /**
   * Busca fotos do usuário no Google Photos
   */
  async getUserPhotos(
    albumId?: string,
    pageSize: number = 20,
    pageToken?: string
  ): Promise<{
    mediaItems: GoogleMediaItem[];
    nextPageToken?: string;
  }> {
    try {
      const url = new URL(`${this.baseUrl}/mediaItems`);
      url.searchParams.set('pageSize', pageSize.toString());
      
      if (albumId) {
        url.searchParams.set('albumId', albumId);
      }
      
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Busca falhou: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        mediaItems: data.mediaItems || [],
        nextPageToken: data.nextPageToken,
      };
    } catch (error) {
      console.error('❌ Erro ao buscar fotos:', error);
      return { mediaItems: [] };
    }
  }

  /**
   * Busca fotos do álbum do Orkut
   */
  async getOrkutPhotos(pageSize: number = 20): Promise<GoogleMediaItem[]> {
    try {
      const album = await this.getOrCreateOrkutAlbum();
      if (!album) {
        return [];
      }

      const result = await this.getUserPhotos(album.id, pageSize);
      return result.mediaItems;
    } catch (error) {
      console.error('❌ Erro ao buscar fotos do Orkut:', error);
      return [];
    }
  }
}

/**
 * Utility functions
 */
export const GooglePhotosUtils = {
  /**
   * Gera URL de thumbnail otimizada
   */
  getThumbnailUrl(baseUrl: string, width: number = 300, height: number = 300): string {
    return `${baseUrl}=w${width}-h${height}-c`;
  },

  /**
   * Gera URL de imagem otimizada
   */
  getOptimizedUrl(baseUrl: string, width: number = 800, height: number = 600): string {
    return `${baseUrl}=w${width}-h${height}`;
  },

  /**
   * Verifica se o token tem as permissões necessárias
   */
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const tokenInfo = await response.json();
      const requiredScopes = [
        'https://www.googleapis.com/auth/photoslibrary',
        'https://www.googleapis.com/auth/photoslibrary.appendonly'
      ];

      return requiredScopes.every(scope => 
        tokenInfo.scope?.includes(scope)
      );
    } catch (error) {
      console.error('❌ Erro na validação do token:', error);
      return false;
    }
  }
};

export default GooglePhotosService;
