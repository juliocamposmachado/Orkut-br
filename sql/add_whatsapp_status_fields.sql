-- Script para adicionar campos de monitoramento WhatsApp Web à tabela profiles
-- Execute este script no seu banco Supabase para habilitar o recurso

-- Adicionar campos relacionados ao WhatsApp status
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS whatsapp_monitoring_consent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_consent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_last_activity TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS whatsapp_updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS whatsapp_detection_method VARCHAR(50);

-- Adicionar índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_monitoring 
ON profiles (whatsapp_monitoring_consent, whatsapp_online) 
WHERE whatsapp_monitoring_consent = true;

CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_updated_at 
ON profiles (whatsapp_updated_at) 
WHERE whatsapp_monitoring_consent = true AND whatsapp_online = true;

-- Comentários para documentar os campos
COMMENT ON COLUMN profiles.whatsapp_monitoring_consent IS 'Se o usuário consentiu com o monitoramento do WhatsApp Web';
COMMENT ON COLUMN profiles.whatsapp_consent_date IS 'Data quando o usuário deu o consentimento';
COMMENT ON COLUMN profiles.whatsapp_online IS 'Status atual se o usuário está online no WhatsApp Web';
COMMENT ON COLUMN profiles.whatsapp_last_activity IS 'Última atividade detectada no WhatsApp Web';
COMMENT ON COLUMN profiles.whatsapp_updated_at IS 'Última vez que o status foi atualizado';
COMMENT ON COLUMN profiles.whatsapp_detection_method IS 'Método usado para detectar a atividade (debug)';

-- Trigger para atualizar whatsapp_updated_at automaticamente quando relevante
CREATE OR REPLACE FUNCTION update_whatsapp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualizar timestamp se campos relacionados ao WhatsApp mudaram
  IF OLD.whatsapp_online IS DISTINCT FROM NEW.whatsapp_online OR
     OLD.whatsapp_last_activity IS DISTINCT FROM NEW.whatsapp_last_activity THEN
    NEW.whatsapp_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_whatsapp_timestamp_update
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_whatsapp_timestamp();

-- Verificar se os campos foram criados corretamente
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name LIKE 'whatsapp_%'
ORDER BY column_name;
