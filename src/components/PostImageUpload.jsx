import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, Link, Copy, CheckCircle, AlertTriangle, Settings, Globe, Save, Database } from 'lucide-react';

const PostImageUpload = ({ onPhotoSaved, className = "" }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);
  const [step, setStep] = useState('upload'); // 'upload' | 'configure' | 'save' | 'complete'
  
  // Configurações do upload
  const [uploadOptions, setUploadOptions] = useState({
    resize: 'no-resize',
    expire: 'no-expiration'
  });

  // Dados da foto para salvar
  const [photoData, setPhotoData] = useState({
    title: '',
    description: '',
    tags: [],
    isPublic: true
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

  // Upload da imagem para PostImage via nossa API
  const uploadToPostImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('resize', uploadOptions.resize);
    formData.append('expire', uploadOptions.expire);

    const response = await fetch('/api/photos/postimage-official', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro no upload');
    }

    return response.json();
  };

  // Salvar links no Supabase
  const saveToDatabase = async (uploadData) => {
    const payload = {
      filename: uploadData.filename,
      links: uploadData.links,
      title: photoData.title || null,
      description: photoData.description || null,
      options: uploadOptions,
      size: uploadData.size || null,
      tags: photoData.tags,
      is_public: photoData.isPublic
    };

    const response = await fetch('/api/photos/save-postimage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erro ao salvar no banco');
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
    setStep('upload');

    try {
      console.log('📤 Iniciando upload PostImage:', file.name);
      
      // 1. Upload para PostImage
      setStep('upload');
      const result = await uploadToPostImage(file);
      
      console.log('✅ Upload PostImage concluído:', result);
      setUploadResult(result);
      
      // Pré-popular título com o nome do arquivo
      if (!photoData.title) {
        setPhotoData(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, '') // Remove extensão
        }));
      }

      setStep('configure');

    } catch (err) {
      console.error('❌ Erro no upload PostImage:', err);
      setError(err.message || 'Erro desconhecido no upload');
      setStep('upload');
    } finally {
      setUploading(false);
    }
  }, [uploadOptions]);

  const handleSaveToDatabase = async () => {
    if (!uploadResult) return;

    setUploading(true);
    setError(null);
    setStep('save');

    try {
      console.log('💾 Salvando no banco de dados...');
      const saveResult = await saveToDatabase(uploadResult);
      
      console.log('✅ Salvo no banco:', saveResult);
      setStep('complete');

      // Callback para o componente pai
      if (onPhotoSaved) {
        onPhotoSaved(saveResult.photo);
      }

    } catch (err) {
      console.error('❌ Erro ao salvar no banco:', err);
      setError(err.message || 'Erro ao salvar no banco');
      setStep('configure');
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setUploadResult(null);
    setError(null);
    setStep('upload');
    setPhotoData({
      title: '',
      description: '',
      tags: [],
      isPublic: true
    });
  };

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

  const addTag = (tag) => {
    if (tag && !photoData.tags.includes(tag)) {
      setPhotoData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tagToRemove) => {
    setPhotoData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <Globe className="w-12 h-12 text-blue-600 mx-auto mb-2" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload PostImage + Supabase</h2>
        <p className="text-gray-600">Upload via PostImage.org e salvar links no banco</p>
      </div>

      {/* Progresso */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-600' : step === 'configure' || step === 'save' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Upload</span>
          </div>
          <div className={`flex items-center gap-2 ${step === 'configure' ? 'text-blue-600' : step === 'save' || step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Configurar</span>
          </div>
          <div className={`flex items-center gap-2 ${step === 'save' ? 'text-blue-600' : step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">Salvar</span>
          </div>
          <div className={`flex items-center gap-2 ${step === 'complete' ? 'text-green-600' : 'text-gray-400'}`}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Concluído</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: step === 'upload' ? '25%' : 
                     step === 'configure' ? '50%' : 
                     step === 'save' ? '75%' : 
                     step === 'complete' ? '100%' : '0%'
            }}
          ></div>
        </div>
      </div>

      {/* Área de upload */}
      {step === 'upload' && (
        <>
          {/* Configurações de upload */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-700">Opções PostImage</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Redimensionamento
                </label>
                <select
                  value={uploadOptions.resize}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, resize: e.target.value }))}
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
                  value={uploadOptions.expire}
                  onChange={(e) => setUploadOptions(prev => ({ ...prev, expire: e.target.value }))}
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

          {/* Área de drop */}
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
                      Enviando para PostImage.org...
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
        </>
      )}

      {/* Configuração dos dados da foto */}
      {step === 'configure' && uploadResult && (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-800">Upload no PostImage realizado!</h4>
                <p className="text-green-700 text-sm mt-1">
                  Agora configure os dados para salvar no banco
                </p>
              </div>
            </div>
          </div>

          {/* Preview da imagem */}
          {uploadResult.links?.direct && (
            <div className="text-center">
              <img
                src={uploadResult.links.direct}
                alt="Preview"
                className="max-w-full max-h-48 object-contain mx-auto border border-gray-200 rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Formulário de dados */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título da Foto
              </label>
              <input
                type="text"
                value={photoData.title}
                onChange={(e) => setPhotoData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Digite um título para sua foto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                value={photoData.description}
                onChange={(e) => setPhotoData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Descreva sua foto..."
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {photoData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Digite uma tag e pressione Enter"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const tag = e.target.value.trim();
                    if (tag) {
                      addTag(tag);
                      e.target.value = '';
                    }
                  }
                }}
              />
            </div>

            {/* Visibilidade */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPublic"
                checked={photoData.isPublic}
                onChange={(e) => setPhotoData(prev => ({ ...prev, isPublic: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                Foto pública (visível para todos)
              </label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSaveToDatabase}
              disabled={uploading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar no Banco
            </button>
            <button
              onClick={resetUpload}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Salvando */}
      {step === 'save' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            Salvando no banco de dados...
          </h3>
          <p className="text-sm text-gray-500">
            Organizando os links no Supabase
          </p>
        </div>
      )}

      {/* Concluído */}
      {step === 'complete' && (
        <div className="text-center space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-green-800 mb-2">
              Foto salva com sucesso!
            </h3>
            <p className="text-green-700">
              Sua foto foi enviada para o PostImage.org e os links foram salvos no banco de dados.
            </p>
          </div>

          <button
            onClick={resetUpload}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <Upload className="w-4 h-4" />
            Enviar Outra Foto
          </button>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-800">Erro no Processo</h4>
            <p className="text-red-700 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostImageUpload;
