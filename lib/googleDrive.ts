/**
 * Google Drive API Integration para Orkut
 * Armazena fotos na pasta "Orkut" do Drive do usuário
 */

interface GoogleDriveConfig {
  accessToken: string;
}

interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  thumbnailLink?: string;
  createdTime: string;
  modifiedTime: string;
  size: string;
  mimeType: string;
  parents: string[];
}

interface UploadResult {
  success: boolean;
  file?: DriveFile;
  error?: string;
}

export class GoogleDriveService {
  private accessToken: string;
  private baseUrl = 'https://www.googleapis.com/drive/v3';

  constructor(config: GoogleDriveConfig) {
    this.accessToken = config.accessToken;
  }

  /**
   * Buscar ou criar pasta "Orkut" no Drive do usuário
   */
  async getOrCreateOrkutFolder(): Promise<DriveFile | null> {
    try {
      // Primeiro, buscar se já existe uma pasta "Orkut"
      const searchResponse = await fetch(
        `${this.baseUrl}/files?q=name='Orkut' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!searchResponse.ok) {
        throw new Error(`Erro na busca: ${searchResponse.statusText}`);
      }

      const searchData = await searchResponse.json();
      
      if (searchData.files && searchData.files.length > 0) {
        console.log('✅ Pasta Orkut encontrada:', searchData.files[0].name);
        return searchData.files[0];
      }

      // Se não encontrou, criar a pasta
      console.log('📁 Criando pasta Orkut...');
      
      const createResponse = await fetch(`${this.baseUrl}/files`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Orkut',
          mimeType: 'application/vnd.google-apps.folder',
          parents: ['root'] // Criar na raiz do Drive
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Erro ao criar pasta: ${createResponse.statusText}`);
      }

      const newFolder = await createResponse.json();
      console.log('✅ Pasta Orkut criada:', newFolder.name);

      // Tornar a pasta pública para leitura
      await this.makePublic(newFolder.id);
      
      return newFolder;
    } catch (error) {
      console.error('❌ Erro ao gerenciar pasta Orkut:', error);
      return null;
    }
  }

  /**
   * Tornar arquivo/pasta público
   */
  private async makePublic(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}/permissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Erro ao tornar público:', error);
      return false;
    }
  }

  /**
   * Upload de foto para a pasta Orkut
   */
  async uploadPhoto(
    photoFile: File,
    description?: string
  ): Promise<UploadResult> {
    try {
      console.log('📤 Iniciando upload para Google Drive:', photoFile.name);

      // Buscar ou criar pasta Orkut
      const orkutFolder = await this.getOrCreateOrkutFolder();
      if (!orkutFolder) {
        throw new Error('Erro ao acessar pasta Orkut');
      }

      // Preparar metadados do arquivo
      const metadata = {
        name: `${Date.now()}_${photoFile.name}`, // Prefixo com timestamp para evitar conflitos
        parents: [orkutFolder.id],
        description: description || `Foto enviada via Orkut: ${photoFile.name}`,
      };

      // Upload em duas etapas: metadados + conteúdo
      const metadataBlob = new Blob([JSON.stringify(metadata)], {
        type: 'application/json',
      });

      // Criar FormData para multipart upload
      const formData = new FormData();
      formData.append('metadata', metadataBlob);
      formData.append('file', photoFile);

      const uploadResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        throw new Error(`Erro no upload: ${uploadResponse.statusText}`);
      }

      const uploadedFile = await uploadResponse.json();
      console.log('✅ Arquivo enviado:', uploadedFile.name);

      // Tornar o arquivo público
      await this.makePublic(uploadedFile.id);

      // Buscar detalhes completos do arquivo
      const fileDetails = await this.getFileDetails(uploadedFile.id);
      
      return {
        success: true,
        file: fileDetails || uploadedFile,
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
   * Buscar detalhes de um arquivo
   */
  async getFileDetails(fileId: string): Promise<DriveFile | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/files/${fileId}?fields=id,name,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,size,mimeType,parents`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao buscar arquivo: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Erro ao buscar detalhes:', error);
      return null;
    }
  }

  /**
   * Listar fotos da pasta Orkut
   */
  async getOrkutPhotos(pageSize: number = 20): Promise<DriveFile[]> {
    try {
      // Buscar pasta Orkut
      const orkutFolder = await this.getOrCreateOrkutFolder();
      if (!orkutFolder) {
        return [];
      }

      // Buscar apenas imagens na pasta Orkut
      const query = `'${orkutFolder.id}' in parents and mimeType contains 'image/' and trashed=false`;
      
      const response = await fetch(
        `${this.baseUrl}/files?q=${encodeURIComponent(query)}&pageSize=${pageSize}&orderBy=createdTime desc&fields=files(id,name,webViewLink,webContentLink,thumbnailLink,createdTime,modifiedTime,size,mimeType,parents)`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao listar fotos: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`📸 ${data.files?.length || 0} fotos encontradas na pasta Orkut`);
      
      return data.files || [];
    } catch (error) {
      console.error('❌ Erro ao listar fotos:', error);
      return [];
    }
  }

  /**
   * Excluir foto (mover para lixeira)
   */
  async deletePhoto(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Erro ao excluir foto:', error);
      return false;
    }
  }

  /**
   * Gerar URL de thumbnail otimizada
   */
  getThumbnailUrl(file: DriveFile, size: number = 300): string {
    if (file.thumbnailLink) {
      // Substituir tamanho padrão pelo desejado
      return file.thumbnailLink.replace(/=s\d+/, `=s${size}`);
    }
    
    // Fallback: usar webContentLink como thumbnail
    return file.webContentLink;
  }

  /**
   * Gerar URL de visualização direta
   */
  getDirectViewUrl(file: DriveFile): string {
    // Para visualização direta sem interface do Google Drive
    return `https://drive.google.com/uc?export=view&id=${file.id}`;
  }

  /**
   * Verificar se token tem permissões necessárias
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/about?fields=user`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return !!data.user;
    } catch (error) {
      console.error('❌ Erro na validação do token:', error);
      return false;
    }
  }
}

/**
 * Utility functions
 */
export const GoogleDriveUtils = {
  /**
   * Formatar tamanho do arquivo
   */
  formatFileSize(bytes: string | number): string {
    const size = typeof bytes === 'string' ? parseInt(bytes) : bytes;
    const units = ['B', 'KB', 'MB', 'GB'];
    let index = 0;
    let fileSize = size;

    while (fileSize >= 1024 && index < units.length - 1) {
      fileSize /= 1024;
      index++;
    }

    return `${fileSize.toFixed(1)} ${units[index]}`;
  },

  /**
   * Verificar se é imagem
   */
  isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  },

  /**
   * Extrair ID do arquivo de uma URL do Google Drive
   */
  extractFileId(url: string): string | null {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/([a-zA-Z0-9_-]+)\/view/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  },
};

export default GoogleDriveService;
