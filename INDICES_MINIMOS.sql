-- ÍNDICES MÍNIMOS - Apenas para conversations
-- Execute este script simples

-- Primeiro, verificar se a tabela conversations existe
SELECT 'Tabela conversations existe!' FROM conversations LIMIT 1;

-- Criar índices APENAS para conversations
CREATE INDEX IF NOT EXISTS idx_conv_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conv_p2 ON conversations(participant2_id);

-- Confirmar que funcionou
SELECT 'Índices para conversations criados!' as resultado;
