-- PASSO 2: Criar índices (APÓS as tabelas estarem criadas)
-- Execute este SOMENTE depois de executar o PASSO 1

-- Índices para tabela conversations
CREATE INDEX IF NOT EXISTS idx_conv_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conv_p2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conv_created ON conversations(created_at);

-- Índices para tabela messages
CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_msg_created ON messages(created_at);

-- Verificar se os índices foram criados
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('conversations', 'messages')
ORDER BY tablename, indexname;
