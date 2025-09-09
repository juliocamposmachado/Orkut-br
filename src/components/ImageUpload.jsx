import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Link, Copy, CheckCircle, AlertTriangle, Settings, Globe } from 'lucide-react';

const ImageUpload = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [options, setOptions] = useState({
    resize: 'no-resize',
    expire: 'no-expiration'
  });

  // Opções disponíveis do PostImage.org
  const resizeOptions = [
    { value: 'no-resize', label: 'Não redimensionar' },
    { value: '100x75', label: '100x75 (avatar)' },
    { value: '150x112', label: '150x112 (miniatura)' },
    { value: '320x240', label: '320x240 (websites e email)' },
    { value: '640x480', label: '640x480 (fóruns)' },
    { value: '800x600', label: '800x600 (monitor 15")' },
    { value: '1024x768', label: '1024x768 (monitor 17")' },
    { value: '1280x1024', label: '1280x1024 (monitor 19")' },
    { value: '1600x1200', label: '1600x1200 (monitor 21")' }
  ];

  const expireOptions = [
    { value: 'no-expiration', label: 'Sem expiração' },
    { value: '1-day', label: 'Remover após 1 dia' },
    { value: '7-days', label: 'Remover após 7 dias' },
    { value: '31-days', label: 'Remover após 31 dias' }
  ];

  // Upload da imagem para nossa API
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('resize', options.resize);
    formData.append('expire', options.expire);

    const response = await fetch('http://localhost:3001/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro no upload');
    }

    return response.json();
  };

  const handleFileUpload = useCallback(async (files) => {
    if (!files?.length) return;

    const file = files[0];
    
    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Formato não suportado. Use JPG, PNG, GIF, BMP ou WebP.');
      return;
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      console.log('📤 Iniciando upload:', file.name);
      const result = await uploadImage(file);
      
      console.log('✅ Upload concluído:', result);
      setUploadResult(result);
    } catch (err) {
      console.error('❌ Erro no upload:', err);
      setError(err.message || 'Erro desconhecido no upload');
    } finally {
      setUploading(false);
    }
  }, [options]);

  // Handlers de drag and drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, [handleFileUpload]);

  // Handler do input de arquivo
  const handleFileInputChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
  }, [handleFileUpload]);

  // Copiar link para clipboard
  const copyToClipboard = async (text, linkType) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLink(linkType);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Mapear tipos de links para labels amigáveis
  const getLinkLabel = (type) => {
    const labels = {
      direct: '🔗 Link Direto',
      image: '🖼️ Link da Imagem',
      markdown: '📝 Markdown',
      reddit_markdown: '🔥 Reddit Markdown',
      forum: '💬 Fórum BB Code',
      html: '🌐 HTML',
      page_url: '📄 Página PostImage',
      unknown: '❓ Link'
    };
    return labels[type] || `🔗 ${type}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <Globe className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">PostImage.org Upload</h2>
        <p className="text-gray-600">Upload usando o site oficial do PostImage.org</p>
      </div>

      {/* Configurações */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-gray-600" />
          <h3 className="font-semibold text-gray-700">Configurações</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redimensionamento
            </label>
            <select
              value={options.resize}
              onChange={(e) => setOptions(prev => ({ ...prev, resize: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {resizeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiração
            </label>
            <select
              value={options.expire}
              onChange={(e) => setOptions(prev => ({ ...prev, expire: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {expireOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Área de upload */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp"
          onChange={handleFileInputChange}
          className="hidden"
          id="fileInput"
          disabled={uploading}
        />
        
        <label htmlFor="fileInput" className="cursor-pointer">
          <div className="flex flex-col items-center">
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Fazendo upload via PostImage.org...
                </h3>
                <p className="text-sm text-gray-500">
                  Aguarde enquanto processamos sua imagem
                </p>
              </>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  Escolha uma imagem ou arraste aqui
                </h3>
                <p className="text-sm text-gray-500">
                  JPG, PNG, GIF, BMP, WebP - Máximo 10MB
                </p>
              </>
            )}
          </div>
        </label>
      </div>

      {/* Erro */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">Erro no Upload</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Resultado do upload */}
      {uploadResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-green-800 mb-2">
                Upload realizado com sucesso!
              </h4>
              <p className="text-green-700 text-sm mb-4">
                Arquivo: {uploadResult.filename}
              </p>

              {/* Links capturados */}
              {uploadResult.links && Object.keys(uploadResult.links).length > 0 && (
                <div className="space-y-3">
                  <h5 className="font-medium text-gray-800">Links disponíveis:</h5>
                  
                  {Object.entries(uploadResult.links).map(([type, url]) => (
                    <div key={type} className="flex items-center gap-2 p-3 bg-white rounded border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-700 text-sm mb-1">
                          {getLinkLabel(type)}
                        </div>
                        <input
                          type="text"
                          value={url}
                          readOnly
                          className="w-full text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 font-mono"
                        />
                      </div>
                      <button
                        onClick={() => copyToClipboard(url, type)}
                        className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                        title="Copiar link"
                      >
                        {copiedLink === type ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}

                  {/* Preview da imagem se tiver link direto */}
                  {uploadResult.links.direct && (
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-800 mb-2">Preview:</h5>
                      <div className="border border-gray-200 rounded-lg overflow-hidden inline-block">
                        <img
                          src={uploadResult.links.direct}
                          alt="Upload preview"
                          className="max-w-full max-h-64 object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Informações adicionais */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <ImageIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800">Como funciona</h4>
            <ul className="text-blue-700 text-sm mt-2 space-y-1">
              <li>• Sua imagem é enviada diretamente para o PostImage.org oficial</li>
              <li>• Todos os links são capturados automaticamente</li>
              <li>• Suporte completo às opções do PostImage (redimensionamento e expiração)</li>
              <li>• Links permanentes e confiáveis</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
