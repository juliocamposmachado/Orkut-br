-- ÍNDICES PARA MESSAGES - Execute APÓS o anterior
-- Execute este script SEPARADAMENTE

-- Primeiro, verificar se a tabela messages existe
SELECT 'Tabela messages existe!' FROM messages LIMIT 1;

-- Criar índices APENAS para messages
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id);

-- Confirmar que funcionou
SELECT 'Índices para messages criados!' as resultado;
