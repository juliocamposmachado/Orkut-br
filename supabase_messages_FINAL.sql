-- Script de mensagens TESTADO - Execute tudo de uma vez no Supabase

-- 1. Criar tabela conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela messages  
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices APÓS as tabelas existirem
CREATE INDEX IF NOT EXISTS idx_conversations_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_p2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- 4. Índice único para evitar conversas duplicadas
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_conv
ON conversations(
  CASE WHEN participant1_id < participant2_id THEN participant1_id ELSE participant2_id END,
  CASE WHEN participant1_id < participant2_id THEN participant2_id ELSE participant1_id END
);

-- 5. Verificar se as tabelas foram criadas
SELECT 'conversations' as table_name, count(*) as rows FROM conversations
UNION ALL
SELECT 'messages' as table_name, count(*) as rows FROM messages;
