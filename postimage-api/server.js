const express = require('express');
const puppeteer = require('puppeteer');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Configurações de middleware
app.use(cors());
app.use(express.json());

// Configuração do multer para uploads temporários
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'temp-uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limite
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|bmp|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Apenas arquivos de imagem são permitidos!'));
    }
  }
});

// Classe para automação do PostImage.org
class PostImageUploader {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async init() {
    try {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      
      // Configurar user agent para parecer um navegador real
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Configurar viewport
      await this.page.setViewport({ width: 1366, height: 768 });
      
      console.log('🚀 Puppeteer inicializado com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao inicializar Puppeteer:', error);
      return false;
    }
  }

  async uploadToPostImage(imagePath, options = {}) {
    if (!this.page) {
      await this.init();
    }

    try {
      console.log('🌐 Navegando para PostImage.org...');
      await this.page.goto('https://postimages.org/', { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Configurar opções de redimensionamento se especificadas
      if (options.resize && options.resize !== 'no-resize') {
        console.log(`🔧 Configurando redimensionamento: ${options.resize}`);
        await this.page.select('#resize', options.resize);
      }

      // Configurar expiração se especificada
      if (options.expire && options.expire !== 'no-expiration') {
        console.log(`⏰ Configurando expiração: ${options.expire}`);
        await this.page.select('#expire', options.expire);
      }

      // Fazer upload da imagem
      console.log('📁 Fazendo upload da imagem...');
      const fileInput = await this.page.$('input[type="file"]#upload_files');
      
      if (!fileInput) {
        throw new Error('Campo de upload não encontrado na página');
      }

      await fileInput.uploadFile(imagePath);

      // Aguardar o botão de upload aparecer e clicar
      console.log('⏳ Aguardando processamento...');
      await this.page.waitForSelector('.upload_button', { timeout: 10000 });
      await this.page.click('.upload_button');

      // Aguardar a página de resultados
      console.log('📋 Aguardando resultados...');
      await this.page.waitForSelector('.upload_success, .upload_completed', { 
        timeout: 60000 
      });

      // Aguardar os links aparecerem
      await this.page.waitForFunction(() => {
        const linkElements = document.querySelectorAll('input[readonly]');
        return linkElements.length > 0;
      }, { timeout: 30000 });

      // Capturar todos os links disponíveis
      const links = await this.page.evaluate(() => {
        const results = {};
        
        // Mapear todos os inputs readonly que contêm links
        const inputs = document.querySelectorAll('input[readonly]');
        
        inputs.forEach(input => {
          const value = input.value;
          if (value && value.includes('postimg.cc')) {
            const label = input.previousElementSibling || input.parentElement.previousElementSibling;
            let linkType = 'unknown';
            
            if (label && label.textContent) {
              const labelText = label.textContent.toLowerCase();
              if (labelText.includes('direto') || labelText.includes('direct')) {
                linkType = 'direct';
              } else if (labelText.includes('markdown') && labelText.includes('reddit')) {
                linkType = 'reddit_markdown';
              } else if (labelText.includes('markdown')) {
                linkType = 'markdown';
              } else if (labelText.includes('fórum') || labelText.includes('forum')) {
                linkType = 'forum';
              } else if (labelText.includes('html') || labelText.includes('site')) {
                linkType = 'html';
              } else if (labelText.includes('imagem')) {
                linkType = 'image';
              }
            }
            
            results[linkType] = value;
          }
        });
        
        // Também capturar da URL se disponível
        const currentUrl = window.location.href;
        if (currentUrl.includes('postimg.cc')) {
          results.page_url = currentUrl;
        }
        
        return results;
      });

      console.log('✅ Upload concluído! Links capturados:', Object.keys(links).length);
      return {
        success: true,
        links,
        message: 'Upload realizado com sucesso!'
      };

    } catch (error) {
      console.error('❌ Erro durante upload:', error.message);
      return {
        success: false,
        error: error.message,
        message: 'Falha ao fazer upload da imagem'
      };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('🔒 Browser fechado');
    }
  }
}

// Instância global do uploader
const uploader = new PostImageUploader();

// Inicializar o uploader na inicialização do servidor
uploader.init().then(() => {
  console.log('🎯 PostImage Uploader pronto!');
});

// Endpoint principal para upload
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nenhuma imagem foi enviada'
    });
  }

  const imagePath = req.file.path;
  const options = {
    resize: req.body.resize || 'no-resize',
    expire: req.body.expire || 'no-expiration'
  };

  console.log(`🎨 Processando upload: ${req.file.originalname}`);

  try {
    // Fazer upload usando Puppeteer
    const result = await uploader.uploadToPostImage(imagePath, options);

    // Limpar arquivo temporário
    await fs.remove(imagePath);

    if (result.success) {
      res.json({
        success: true,
        filename: req.file.originalname,
        links: result.links,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        error: result.error
      });
    }

  } catch (error) {
    // Limpar arquivo temporário em caso de erro
    await fs.remove(imagePath).catch(() => {});
    
    console.error('❌ Erro no processamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Endpoint de status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    service: 'PostImage.org API',
    version: '1.0.0',
    uploader_ready: !!uploader.browser
  });
});

// Endpoint de informações
app.get('/api/info', (req, res) => {
  res.json({
    service: 'PostImage.org Official API',
    description: 'Upload automático usando o site oficial do PostImage.org',
    supported_formats: ['jpeg', 'jpg', 'png', 'gif', 'bmp', 'webp'],
    max_file_size: '10MB',
    resize_options: [
      'no-resize',
      '100x75',
      '150x112', 
      '320x240',
      '640x480',
      '800x600',
      '1024x768',
      '1280x1024',
      '1600x1200'
    ],
    expire_options: [
      'no-expiration',
      '1-day',
      '7-days',
      '31-days'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  await uploader.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  await uploader.close();
  process.exit(0);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor PostImage API rodando na porta ${PORT}`);
  console.log(`📍 Status: http://localhost:${PORT}/api/status`);
  console.log(`📋 Info: http://localhost:${PORT}/api/info`);
});

module.exports = app;
