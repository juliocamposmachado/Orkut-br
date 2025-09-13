-- Adicionar campos para monitoramento de status do WhatsApp na tabela profiles
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas para status do WhatsApp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_last_activity TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_monitoring_consent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS whatsapp_consent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS whatsapp_detection_method TEXT;

-- Comentários explicativos
COMMENT ON COLUMN profiles.whatsapp_online IS 'Status atual do usuário no WhatsApp Web (online/offline)';
COMMENT ON COLUMN profiles.whatsapp_last_activity IS 'Timestamp da última atividade detectada no WhatsApp';
COMMENT ON COLUMN profiles.whatsapp_updated_at IS 'Timestamp da última atualização do status';
COMMENT ON COLUMN profiles.whatsapp_monitoring_consent IS 'Se o usuário autorizou o monitoramento do WhatsApp';
COMMENT ON COLUMN profiles.whatsapp_consent_date IS 'Data em que o usuário deu consentimento';
COMMENT ON COLUMN profiles.whatsapp_detection_method IS 'Método usado para detectar o status (para debug)';

-- Criar índice para consultas de status online
CREATE INDEX IF NOT EXISTS profiles_whatsapp_online_idx 
ON profiles (whatsapp_online) 
WHERE whatsapp_online = true AND whatsapp_monitoring_consent = true;

-- Criar índice para consultas por última atividade
CREATE INDEX IF NOT EXISTS profiles_whatsapp_activity_idx 
ON profiles (whatsapp_updated_at) 
WHERE whatsapp_monitoring_consent = true;

-- Política RLS para permitir usuários verem seu próprio status
CREATE POLICY IF NOT EXISTS "Users can view their own whatsapp status" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Política RLS para permitir usuários atualizarem seu próprio status
CREATE POLICY IF NOT EXISTS "Users can update their own whatsapp status" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);
