# 🚀 PostImage.org API

Uma API Node.js que automatiza o upload de imagens usando o site oficial do **PostImage.org** através do Puppeteer.

## ✨ Características

- ✅ **100% Oficial**: Usa o site real do PostImage.org
- 🔗 **Captura Automática**: Todos os links são capturados automaticamente
- ⚙️ **Configurável**: Suporte completo às opções do PostImage (redimensionamento e expiração)
- 🛡️ **Confiável**: Links permanentes e estáveis
- 🎯 **Interface Amigável**: Interface de teste incluída
- 📱 **React Ready**: Componente React pronto para usar

## 🛠️ Instalação

```bash
# Clone ou baixe o projeto
cd postimage-api

# Instalar dependências
npm install

# Iniciar servidor
npm start
```

## 📋 Uso

### 1. Iniciar a API

```bash
# Opção 1: Via npm
npm start

# Opção 2: Via script .bat (Windows)
start-api.bat

# Opção 3: Modo desenvolvimento
npm run dev
```

### 2. Testar a API

Abra `test.html` no navegador ou acesse:
- Status: http://localhost:3001/api/status
- Info: http://localhost:3001/api/info

### 3. Upload via API

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);
formData.append('resize', 'no-resize'); // Opcional
formData.append('expire', 'no-expiration'); // Opcional

fetch('http://localhost:3001/api/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Links:', data.links);
});
```

## 📚 Endpoints

### GET `/api/status`
Retorna o status da API e se o uploader está pronto.

**Resposta:**
```json
{
  "status": "online",
  "service": "PostImage.org API",
  "version": "1.0.0",
  "uploader_ready": true
}
```

### GET `/api/info`
Retorna informações sobre formatos suportados e opções disponíveis.

### POST `/api/upload`
Faz upload de uma imagem para o PostImage.org.

**Parâmetros:**
- `image` (arquivo): Imagem para upload
- `resize` (opcional): Opção de redimensionamento
- `expire` (opcional): Opção de expiração

**Resposta de Sucesso:**
```json
{
  "success": true,
  "filename": "minha-imagem.jpg",
  "links": {
    "direct": "https://i.postimg.cc/abc123/image.jpg",
    "markdown": "[Image](https://postimg.cc/abc123)",
    "html": "<img src='https://i.postimg.cc/abc123/image.jpg'>",
    "forum": "[img]https://i.postimg.cc/abc123/image.jpg[/img]",
    "page_url": "https://postimg.cc/abc123"
  }
}
```

## 🎨 Opções de Configuração

### Redimensionamento
- `no-resize`: Não redimensionar
- `100x75`: Avatar
- `150x112`: Miniatura
- `320x240`: Websites e email
- `640x480`: Fóruns
- `800x600`: Monitor 15"
- `1024x768`: Monitor 17"
- `1280x1024`: Monitor 19"
- `1600x1200`: Monitor 21"

### Expiração
- `no-expiration`: Sem expiração
- `1-day`: Remover após 1 dia
- `7-days`: Remover após 7 dias
- `31-days`: Remover após 31 dias

## 🖼️ Formatos Suportados

- **JPEG/JPG** - Máximo 10MB
- **PNG** - Máximo 10MB  
- **GIF** - Máximo 10MB
- **BMP** - Máximo 10MB
- **WebP** - Máximo 10MB

## ⚛️ Integração com React

```jsx
import ImageUpload from './components/ImageUpload';

function App() {
  return (
    <div className="App">
      <ImageUpload />
    </div>
  );
}
```

## 🔧 Como Funciona

1. **Upload**: O arquivo é recebido temporariamente pelo servidor
2. **Automação**: Puppeteer navega até o PostImage.org
3. **Configuração**: Aplica as opções escolhidas (resize, expire)
4. **Upload Real**: Faz upload usando o formulário oficial do site
5. **Captura**: Monitora a página e captura todos os links gerados
6. **Retorno**: Envia os links de volta para o cliente
7. **Limpeza**: Remove o arquivo temporário

## 🛡️ Vantagens

- **Oficial**: Usa exatamente os mesmos métodos do site oficial
- **Confiável**: Links gerados pelo próprio PostImage.org
- **Completo**: Captura todos os tipos de links disponíveis
- **Flexível**: Todas as opções do site original disponíveis
- **Transparente**: Logs detalhados de todo o processo

## 🚨 Requisitos do Sistema

- **Node.js** 16+ 
- **npm** 8+
- **Chromium** (instalado automaticamente pelo Puppeteer)
- **Conexão com internet** para acessar PostImage.org

## 🐛 Solução de Problemas

### API não inicia
- Verifique se a porta 3001 está disponível
- Execute `npm install` novamente

### Upload falha
- Verifique se o PostImage.org está acessível
- Confirme se o arquivo é menor que 10MB
- Teste formatos suportados: JPG, PNG, GIF, BMP, WebP

### Links não são capturados
- O Puppeteer pode precisar de mais tempo
- Verifique logs no console para erros específicos

## 📄 Licença

MIT License - Use livremente em seus projetos!

## 🤝 Contribuição

Contribuições são bem-vindas! Abra issues ou pull requests.

---

**Desenvolvido com ❤️ para a comunidade Orkut**
