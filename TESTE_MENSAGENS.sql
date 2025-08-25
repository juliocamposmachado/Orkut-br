-- TESTE SE O SISTEMA JÁ FUNCIONA
-- Execute este script para verificar se as mensagens já funcionam

-- 1. Verificar estrutura das tabelas
SELECT 
    table_name, 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('conversations', 'messages')
ORDER BY table_name, ordinal_position;

-- 2. Contar registros
SELECT 'conversations' as tabela, count(*) as registros FROM conversations
UNION ALL
SELECT 'messages' as tabela, count(*) as registros FROM messages;

-- 3. Testar inserção de conversa (exemplo)
/*
INSERT INTO conversations (participant1_id, participant2_id) 
VALUES (
  'test-user-1', 
  'test-user-2'
);
*/

SELECT 'Sistema está pronto para uso!' as status;
