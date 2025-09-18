/**
 * 🚀 DPASTE.ORG API CLIENT - Cliente Real
 * =====================================
 * Cliente para integrar com a API oficial do dpaste.org
 * Documentação: https://dpaste.org/api/
 */

interface DPasteResponse {
  url: string;
  lexer: string;
  content: string;
}

interface DPasteCreateRequest {
  content: string;
  lexer?: string;
  format?: 'default' | 'url' | 'json';
  expires?: 'onetime' | 'never' | '3600' | '604800' | '2592000';
  filename?: string;
}

export class DPasteClient {
  private baseUrl = 'https://dpaste.org/api/';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Cria um novo snippet no dpaste.org
   */
  async createSnippet(request: DPasteCreateRequest): Promise<DPasteResponse | null> {
    try {
      const formData = new FormData();
      formData.append('content', request.content);
      formData.append('format', request.format || 'json');
      formData.append('lexer', request.lexer || 'json');
      formData.append('expires', request.expires || '2592000'); // 1 mês
      
      if (request.filename) {
        formData.append('filename', request.filename);
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        console.error('❌ Erro ao criar snippet:', response.statusText);
        return null;
      }

      const result: DPasteResponse = await response.json();
      console.log('✅ Snippet criado:', result.url);
      return result;
    } catch (error) {
      console.error('❌ Erro na API do DPaste:', error);
      return null;
    }
  }

  /**
   * Obtém o conteúdo de um snippet
   */
  async getSnippet(url: string): Promise<string | null> {
    try {
      // Cache check
      const cached = this.cache.get(url);
      if (cached && Date.now() < cached.timestamp + cached.ttl) {
        return cached.data;
      }

      const response = await fetch(url + '.txt'); // Adiciona .txt para obter conteúdo puro
      
      if (!response.ok) {
        console.error('❌ Erro ao obter snippet:', response.statusText);
        return null;
      }

      const content = await response.text();
      
      // Cache do resultado
      this.cache.set(url, {
        data: content,
        timestamp: Date.now(),
        ttl: this.defaultTTL
      });

      return content;
    } catch (error) {
      console.error('❌ Erro ao obter snippet:', error);
      return null;
    }
  }

  /**
   * Salva um objeto JSON como snippet
   */
  async saveJSON(data: any, description?: string): Promise<string | null> {
    const content = JSON.stringify(data, null, 2);
    
    const result = await this.createSnippet({
      content,
      lexer: 'json',
      format: 'json',
      expires: 'never', // Dados importantes não expiram
      filename: description ? `${description}.json` : 'orkut-data.json'
    });

    return result?.url || null;
  }

  /**
   * Carrega um objeto JSON de um snippet
   */
  async loadJSON(url: string): Promise<any | null> {
    try {
      const content = await this.getSnippet(url);
      if (!content) return null;

      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Erro ao parsear JSON:', error);
      return null;
    }
  }

  /**
   * Salva múltiplos objetos em um índice
   */
  async saveIndex(data: { [key: string]: any }): Promise<string | null> {
    const index = {
      type: 'orkut-index',
      created_at: new Date().toISOString(),
      version: '1.0.0',
      data
    };

    return this.saveJSON(index, 'orkut-index');
  }

  /**
   * Carrega índice
   */
  async loadIndex(url: string): Promise<{ [key: string]: any } | null> {
    try {
      const index = await this.loadJSON(url);
      if (!index || index.type !== 'orkut-index') {
        console.error('❌ Índice inválido');
        return null;
      }

      return index.data;
    } catch (error) {
      console.error('❌ Erro ao carregar índice:', error);
      return null;
    }
  }

  /**
   * Lista URLs conhecidas (simulado - dpaste.org não tem lista)
   */
  getKnownUrls(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache do DPaste limpo');
  }

  /**
   * Status da conexão
   */
  async healthCheck(): Promise<boolean> {
    try {
      const testResult = await this.createSnippet({
        content: '// Health check test',
        lexer: 'javascript',
        expires: 'onetime'
      });
      
      return testResult !== null;
    } catch (error) {
      console.error('❌ Health check falhou:', error);
      return false;
    }
  }
}

// Singleton para uso global
let dpasteClient: DPasteClient | null = null;

export function getDPasteClient(): DPasteClient {
  if (!dpasteClient) {
    dpasteClient = new DPasteClient();
  }
  return dpasteClient;
}

export default DPasteClient;
