# 🔧 Correção do Erro avatar_url no Supabase

## ❌ Problema
O erro `42703: record "new" has no field "avatar_url"` está ocorrendo porque existe uma função `handle_new_user` no banco de dados que tenta inserir dados usando o campo `avatar_url`, mas a tabela `profiles` só tem o campo `photo_url`.

## ✅ Solução
Execute o script SQL `supabase-fix-avatar-url.sql` no painel do Supabase.

---

## 📋 Instruções Passo a Passo

### 1. Acesse o Painel do Supabase
- Vá para [https://app.supabase.com](https://app.supabase.com)
- Faça login na sua conta
- Selecione o projeto do Orkut

### 2. Abra o SQL Editor
- No menu lateral esquerdo, clique em **"SQL Editor"**
- Você verá uma interface para executar comandos SQL

### 3. Cole o Script
- Abra o arquivo `supabase-fix-avatar-url.sql`
- Copie **TODO** o conteúdo do arquivo (Ctrl+A, Ctrl+C)
- Cole no SQL Editor do Supabase (Ctrl+V)

### 4. Execute o Script
- Clique no botão **"Run"** (▶️) no canto superior direito
- O script será executado e você verá as mensagens de saída

### 5. Verifique os Resultados
Você deve ver mensagens similares a estas:

```
✅ NOTICE: Função handle_new_user encontrada - será corrigida
✅ Script executado com sucesso!
✅ NOTICE: Função handle_new_user está disponível e corrigida
```

---

## 🔍 O que o Script Faz

### Verificações Iniciais
- ✔️ Verifica se a função `handle_new_user` existe
- ✔️ Mostra a estrutura atual da tabela `profiles`
- ✔️ Lista triggers que usam `handle_new_user`

### Correções Aplicadas
- 🔧 **Remove** a função `handle_new_user` antiga (com bug)
- 🔧 **Cria** uma nova função corrigida que usa `photo_url`
- 🔧 **Recria** o trigger para novos usuários
- 🔧 **Verifica** políticas RLS que podem ter o mesmo problema

### Validações Finais
- ✅ Confirma que a função foi criada corretamente
- ✅ Mostra a estrutura final da tabela
- ✅ Testa se tudo está funcionando

---

## 🚨 Importante

### ⚠️ Backup Automático
- O Supabase faz backup automático, então é seguro executar
- O script **NÃO deleta** dados existentes
- Apenas corrige funções e triggers

### ⚠️ Se Algo Der Errado
- Você pode reverter acessando "Database" > "Backups"
- Ou entre em contato para ajuda adicional

### ⚠️ Após a Execução
- Teste criar uma nova conta no site
- Verifique se o erro `avatar_url` não aparece mais
- O login com Google deve funcionar perfeitamente

---

## 📝 Log do Que Foi Corrigido

### Antes (❌ Com Erro)
```sql
-- Função antiga tentava inserir:
INSERT INTO profiles (avatar_url, ...) -- CAMPO NÃO EXISTE!
```

### Depois (✅ Corrigido)
```sql
-- Função nova usa o campo correto:
INSERT INTO profiles (photo_url, ...) -- CAMPO EXISTE! ✓
```

---

## 🔄 Próximos Passos

Após executar o script:

1. **Teste o registro de novos usuários**
2. **Teste o login com Google**  
3. **Verifique se não há mais erros no console**
4. **Se tudo funcionar, marque como resolvido! 🎉**

---

## 🆘 Se Precisar de Ajuda

Se algo não funcionar:

1. **Copie** todas as mensagens que apareceram no SQL Editor
2. **Tire** um screenshot da tela
3. **Me informe** qual foi o erro específico

O script foi criado para ser **100% seguro** e resolver definitivamente o problema do `avatar_url`! 

---

*Arquivo criado em: 25/08/2025 - 23:12*
*Problema: Erro 42703 - avatar_url não existe*
*Status: Pronto para execução ✅*
