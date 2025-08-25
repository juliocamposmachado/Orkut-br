-- PASSO 2 CORRIGIDO: Criar apenas índices essenciais
-- Execute APÓS o PASSO 1 ter funcionado

-- Verificar se as tabelas existem primeiro
SELECT 'Tabelas encontradas:' as status, count(*) as total 
FROM information_schema.tables 
WHERE table_name IN ('conversations', 'messages');

-- Criar índices básicos para conversations
CREATE INDEX idx_conv_p1 ON conversations(participant1_id);
CREATE INDEX idx_conv_p2 ON conversations(participant2_id);

-- Criar índices básicos para messages  
CREATE INDEX idx_msg_conv ON messages(conversation_id);
CREATE INDEX idx_msg_sender ON messages(sender_id);

-- Verificar se os índices foram criados
SELECT 'Índices criados com sucesso!' as resultado;
