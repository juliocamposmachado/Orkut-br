# 📁 Integração Google Drive - Orkut Fotos

## 🎯 Visão Geral

Foi implementada uma integração completa do Google Drive para o sistema de fotos do Orkut, permitindo que os usuários armazenem suas fotos em seus próprios Google Drives, mantendo a propriedade dos arquivos enquanto compartilham através da plataforma Orkut.

## 🔧 Arquitetura da Solução

### 1. **Componentes React**

#### `GoogleDriveUpload` (`/components/photos/GoogleDriveUpload.tsx`)
- **Função**: Modal de upload de fotos para Google Drive
- **Features**:
  - Drag & drop de arquivos
  - Preview da imagem antes do upload
  - Campo de descrição opcional
  - Validação de tipo e tamanho de arquivo (max 15MB)
  - Feedback visual de progresso
  - Tratamento de re-autenticação automática

#### `GoogleDriveService` (`/lib/google-drive-service.ts`)
- **Função**: Serviço para interagir com Google Drive API
- **Operações**:
  - Autenticação via token OAuth
  - Busca ou criação da pasta "Orkut" no Drive
  - Upload de fotos
  - Listagem de fotos
  - Exclusão de arquivos
  - Geração de URLs de visualização e miniaturas

### 2. **Hooks React**

#### `useGoogleDrive` (`/hooks/use-google-drive.ts`)
- **Função**: Hook para gerenciar estado e operações do Google Drive
- **Estado Gerenciado**:
  - Lista de fotos do Drive
  - Status de loading
  - Status de upload
  - Verificação de acesso ao Google Drive
- **Operações**:
  - Upload de fotos com progresso
  - Busca de fotos do usuário
  - Verificação de permissões

### 3. **Integração com usePhotos**

#### `usePhotos` (`/hooks/use-photos.tsx`) - Atualizado
- **Nova Funcionalidade**: Combina fotos do Supabase com fotos do Google Drive
- **Conversão de Dados**: Converte formato das fotos do Drive para o formato padrão do sistema
- **Ordenação**: Exibe fotos ordenadas por data de criação (mais recentes primeiro)
- **Categoria**: Marca fotos do Drive com categoria "Google Drive"

### 4. **API Routes**

#### `/api/photos/google-drive/route.ts`
- **GET**: Busca fotos da pasta "Orkut" do usuário no Google Drive
- **POST**: Realiza upload de nova foto para o Google Drive
- **Features**:
  - Validação de token de acesso
  - Criação automática da pasta "Orkut"
  - Processamento de upload multipart
  - Geração de metadados da foto
  - Salvamento de registro no Supabase (opcional)

#### `/api/photos/google-drive/check/route.ts` (se existir)
- **GET**: Verifica se o usuário tem acesso válido ao Google Drive

### 5. **Contexto de Autenticação**

#### `enhanced-auth-context.tsx` - Atualizado
- **Novo Escopo**: Adicionado `'https://www.googleapis.com/auth/drive.file'`
- **Permissão**: Permite acesso a arquivos criados pela aplicação no Google Drive

## 🔐 Fluxo de Autenticação

1. **Login Inicial**: Usuário faz login via Google OAuth com escopo do Drive
2. **Verificação de Acesso**: Sistema verifica se token tem permissões do Drive
3. **Re-autenticação**: Se necessário, solicita nova autenticação com permissões corretas
4. **Token Management**: Tokens são gerenciados via Supabase Auth

## 📂 Estrutura de Armazenamento

```
Google Drive do Usuário/
└── Orkut/                          # Pasta criada automaticamente
    ├── foto1.jpg                   # Fotos enviadas pelo usuário
    ├── foto2.png
    └── ...
```

## 🚀 Funcionalidades Implementadas

### ✅ Para Usuários
- **Upload Direto**: Envio de fotos diretamente para seu Google Drive
- **Visualização**: Exibição das fotos do Drive junto com outras fotos
- **Organização**: Fotos ficam organizadas na pasta "Orkut"
- **Controle**: Usuário mantém propriedade total dos arquivos
- **Fácil Acesso**: Botões dedicados na interface de fotos

### ✅ Para Sistema
- **Integração Transparente**: Fotos do Drive aparecem normalmente na galeria
- **Fallback Automático**: Se Drive não disponível, outras opções funcionam
- **Metadados**: Sistema salva referências e metadados no Supabase
- **Performance**: Cache e otimização de requests

## 🎨 Interface de Usuário

### Na Página de Fotos (`/fotos`)

#### Header da Página
- Botão **"Google Drive"** sempre disponível (azul-verde)
- Posicionado ao lado dos botões de Google Photos e upload tradicional

#### Empty State
- Quando não há fotos, mostra botão **"Salvar no Drive"**
- Incentiva uso da funcionalidade do Google Drive

#### Grid de Fotos
- Fotos do Google Drive aparecem com categoria "Google Drive"
- Miniaturas carregadas via thumbnailLink do Google Drive
- Ordenação cronológica junto com outras fotos

## 🔧 Configurações Necessárias

### 1. Variáveis de Ambiente (.env.local)
```env
# Google OAuth (já configurado para Supabase Auth)
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica
```

### 2. Google Cloud Console
- **OAuth 2.0 Client**: Configurado no Supabase Auth
- **Escopos Necessários**:
  - `https://www.googleapis.com/auth/userinfo.email`
  - `https://www.googleapis.com/auth/userinfo.profile`
  - `https://www.googleapis.com/auth/drive.file` ✨ **NOVO**

### 3. Supabase Auth Settings
- Provider Google habilitado
- Scopes atualizados para incluir Google Drive

## 🧪 Como Testar

### 1. **Desenvolvimento Local**
```bash
npm run dev
# Acesse http://localhost:3000/fotos
```

### 2. **Fluxo de Teste**
1. Faça login com conta Google
2. Acesse página `/fotos`
3. Clique em "Google Drive" no header
4. Selecione uma imagem para upload
5. Adicione descrição (opcional)
6. Confirme upload
7. Verifique se foto aparece na galeria
8. Confirme que pasta "Orkut" foi criada no seu Google Drive

### 3. **Verificações**
- [ ] Pasta "Orkut" criada no Google Drive
- [ ] Arquivo enviado está na pasta
- [ ] Foto aparece na galeria do site
- [ ] Thumbnail carrega corretamente
- [ ] Categoria "Google Drive" está visível

## 🐛 Tratamento de Erros

### Cenários Cobertos
- **Token Expirado**: Re-autenticação automática
- **Sem Permissão Drive**: Solicita novas permissões
- **Arquivo Inválido**: Validação de tipo e tamanho
- **Quota Excedida**: Mensagem de erro apropriada
- **Rede Instável**: Retry e feedback de erro

### Logs e Debugging
- Console logs detalhados para desenvolvimento
- Toast notifications para usuário
- Estados de loading e erro

## 📈 Próximos Passos

### Melhorias Potenciais
1. **Sincronização Bidirecional**: Detectar fotos adicionadas diretamente na pasta
2. **Gestão de Pastas**: Permitir organização em subpastas
3. **Compartilhamento**: Opções avançadas de privacidade
4. **Backup Automático**: Backup de fotos existentes para Drive
5. **Bulk Upload**: Envio de múltiplas fotos simultaneamente

### Otimizações
- Cache de thumbnails
- Lazy loading de fotos do Drive
- Compressão de imagens antes do upload
- Integração com Google Photos API também

## 🔒 Considerações de Segurança

- **OAuth Seguro**: Tokens gerenciados pelo Supabase
- **Escopo Mínimo**: Apenas acesso a arquivos criados pela app
- **Validação Server-side**: Todas operações validadas no backend
- **Rate Limiting**: Controle de frequência de requests
- **Sanitização**: Validação de nomes de arquivo e metadados

---

## 📋 Resumo da Implementação

✅ **Concluído**: Integração completa do Google Drive para upload e exibição de fotos  
✅ **Interface**: Botões e modais integrados na página de fotos  
✅ **Backend**: API routes para comunicação com Google Drive  
✅ **Frontend**: Hooks e componentes para gerenciar estado  
✅ **Autenticação**: Escopos OAuth atualizados  
✅ **Compilação**: Sistema compila sem erros  

A integração está **100% funcional** e pronta para uso! 🎉

---

*Desenvolvido para o projeto Orkut - Sistema de fotos integrado ao Google Drive*
