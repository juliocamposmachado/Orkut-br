# 🗄️ PasteDatabase

Um sistema de banco de dados simples e eficiente que usa a API do [Paste](https://paste.safone.me) como backend de armazenamento. Perfeito para projetos pequenos e médios que precisam de persistência de dados sem a complexidade de configurar um banco de dados tradicional.

## 📋 Características

- ✅ **Operações CRUD completas** (Create, Read, Update, Delete)
- ✅ **Sistema de indexação** para busca rápida
- ✅ **Busca por texto** em campos específicos ou em todos os dados
- ✅ **Metadados personalizados** para cada registro
- ✅ **Backup automático** do banco de dados
- ✅ **Armazenamento na nuvem** grátis via API do Paste
- ✅ **Sem configuração** - funciona imediatamente

## 🚀 Instalação Rápida

1. **Baixe os arquivos**:
   - `paste_database.py` - Biblioteca principal
   - `examples.py` - Exemplos de uso

2. **Instale as dependências**:
   ```bash
   pip install requests
   ```

3. **Use em seu projeto**:
   ```python
   from paste_database import PasteDatabase
   
   # Inicializar
   db = PasteDatabase()
   
   # Criar registro
   db.create("usuario_001", {"nome": "João", "idade": 30})
   
   # Ler registro
   usuario = db.read("usuario_001")
   print(usuario.data)  # {"nome": "João", "idade": 30}
   ```

## 📖 Documentação da API

### Inicialização

```python
from paste_database import PasteDatabase

# Usar servidor padrão
db = PasteDatabase()

# Usar servidor personalizado
db = PasteDatabase("https://paste.exemplo.com")
```

### Operações CRUD

#### ✨ CREATE - Criar Registro

```python
# Sintaxe básica
record_id = db.create(key, data, metadata=None)

# Exemplo
user_id = db.create(
    "user_001", 
    {"nome": "Maria", "email": "maria@email.com"},
    {"tipo": "usuario", "status": "ativo"}
)
```

#### 📖 READ - Ler Registro

```python
# Sintaxe básica
record = db.read(key)

# Exemplo
usuario = db.read("user_001")
if usuario:
    print(f"Nome: {usuario.data['nome']}")
    print(f"Email: {usuario.data['email']}")
    print(f"Criado em: {usuario.created_at}")
```

#### 🔄 UPDATE - Atualizar Registro

```python
# Sintaxe básica
success = db.update(key, new_data, new_metadata=None)

# Exemplo
sucesso = db.update("user_001", {
    "nome": "Maria Silva",
    "email": "maria.silva@email.com",
    "telefone": "(11) 99999-9999"
})
```

#### 🗑️ DELETE - Deletar Registro

```python
# Sintaxe básica
success = db.delete(key)

# Exemplo
if db.delete("user_001"):
    print("Usuário deletado com sucesso!")
```

### Operações de Consulta

#### 📊 Listar Chaves

```python
# Listar todas as chaves
chaves = db.list_keys()
print(f"Registros: {chaves}")

# Contar registros
total = db.count()
print(f"Total: {total}")
```

#### 🔍 Buscar Registros

```python
# Buscar em todos os campos
resultados = db.search("João")

# Buscar em campo específico
usuarios_sp = db.search("São Paulo", "cidade")

# Exemplo de uso
for chave in resultados:
    registro = db.read(chave)
    print(f"Encontrado: {registro.data}")
```

#### 💾 Backup

```python
# Criar backup
backup_id = db.backup("meu_backup.json")
print(f"Backup salvo: https://paste.safone.me/doc/{backup_id}")

# Backup automático (nome gerado)
backup_id = db.backup()
```

## 🛠️ Estrutura dos Dados

### DatabaseRecord

Cada registro no banco tem a seguinte estrutura:

```python
@dataclass
class DatabaseRecord:
    id: str                    # ID único no Paste
    data: Dict[str, Any]       # Seus dados
    created_at: int            # Timestamp de criação
    updated_at: int            # Timestamp da última atualização
    metadata: Dict[str, str]   # Metadados opcionais
```

### Índice

O sistema mantém um índice interno para mapear suas chaves para os IDs do Paste:

```json
{
  "user_001": {
    "paste_id": "abc123",
    "created_at": 1641234567,
    "updated_at": 1641234567,
    "metadata": {"tipo": "usuario"}
  }
}
```

## 📝 Exemplos Práticos

### Sistema de Biblioteca

```python
from paste_database import PasteDatabase

db = PasteDatabase()

# Adicionar livro
db.create("livro_001", {
    "titulo": "1984",
    "autor": "George Orwell",
    "ano": 1949,
    "disponivel": True
}, {"categoria": "ficção"})

# Emprestar livro
livro = db.read("livro_001")
livro_data = livro.data.copy()
livro_data["disponivel"] = False
livro_data["emprestado_para"] = "João Silva"

db.update("livro_001", livro_data)

# Buscar livros disponíveis
for chave in db.list_keys():
    livro = db.read(chave)
    if livro and livro.data.get("disponivel"):
        print(f"Disponível: {livro.data['titulo']}")
```

### E-commerce Simples

```python
db = PasteDatabase()

# Adicionar produto
db.create("prod_001", {
    "nome": "iPhone 13",
    "preco": 4999.99,
    "estoque": 10,
    "categoria": "Smartphones"
})

# Processar venda
produto = db.read("prod_001")
if produto and produto.data["estoque"] > 0:
    # Reduzir estoque
    produto_data = produto.data.copy()
    produto_data["estoque"] -= 1
    db.update("prod_001", produto_data)
    
    # Registrar venda
    db.create("venda_001", {
        "produto": "prod_001",
        "quantidade": 1,
        "total": produto.data["preco"],
        "cliente": "Maria Silva"
    }, {"status": "concluida"})
```

### Sistema de Configuração

```python
db = PasteDatabase()

# Salvar configurações
db.create("config_app", {
    "tema": "escuro",
    "idioma": "pt-BR",
    "notificacoes": True,
    "limite_usuarios": 100
})

# Carregar configurações
config = db.read("config_app")
if config:
    print(f"Tema atual: {config.data['tema']}")
```

## ⚡ Dicas de Performance

### 1. Use Metadados para Filtragem

```python
# Adicione metadados para facilitar consultas
db.create("user_001", user_data, {"tipo": "admin", "ativo": "sim"})
db.create("user_002", user_data, {"tipo": "cliente", "ativo": "não"})
```

### 2. Mantenha os Dados Estruturados

```python
# ✅ Bom - estrutura consistente
user_data = {
    "nome": str,
    "idade": int,
    "email": str,
    "ativo": bool
}

# ❌ Evite - estrutura inconsistente
user1 = {"name": "João", "age": 30}
user2 = {"nome": "Maria", "idade": 25, "telefone": "123"}
```

### 3. Use Chaves Descritivas

```python
# ✅ Bom
db.create("usuario_joao_silva_001", data)
db.create("produto_iphone13_001", data)
db.create("pedido_2024_001", data)

# ❌ Evite
db.create("1", data)
db.create("abc", data)
```

## 🔒 Limitações e Considerações

### Limitações do Paste

- **Tamanho máximo**: ~1MB por registro
- **Rate limiting**: Evite muitas requisições simultâneas
- **Durabilidade**: Depende do serviço Paste (geralmente permanente)

### Considerações de Segurança

- **Dados públicos**: Todo conteúdo fica publicamente acessível
- **Não use para dados sensíveis**: Senhas, tokens, informações pessoais
- **Ideal para**: Configurações, dados públicos, protótipos

### Performance

- **Busca sequencial**: Não há indexação no servidor
- **Latência de rede**: Cada operação faz requisição HTTP
- **Cache local**: Considere implementar cache para dados frequentes

## 🐛 Tratamento de Erros

```python
try:
    # Operações do banco
    db.create("key", data)
    record = db.read("key")
    
except ValueError as e:
    print(f"Erro de validação: {e}")
    
except Exception as e:
    print(f"Erro de rede ou API: {e}")
```

## 📊 Casos de Uso Recomendados

### ✅ Ideal Para:
- Protótipos e MVPs
- Sistemas de configuração
- Catálogos públicos
- Dados de demonstração
- Aplicações educacionais
- Projetos pessoais

### ❌ Não Recomendado Para:
- Dados sensíveis ou privados
- Sistemas de produção críticos
- Aplicações com milhares de registros
- Dados que precisam de transações ACID
- Informações regulamentadas (LGPD, GDPR)

## 🤝 Contribuição

Quer melhorar o PasteDatabase? 

1. Faça um fork do código
2. Implemente suas melhorias
3. Teste com diferentes cenários
4. Compartilhe suas mudanças

## 📄 Licença

Este projeto é de domínio público. Use livremente!

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique sua conexão** com a internet
2. **Teste a API do Paste** diretamente: https://paste.safone.me
3. **Revise os exemplos** nesta documentação
4. **Execute o arquivo de exemplos**: `python examples.py`

---

**📱 Desenvolvido com ❤️ para a comunidade Python**
