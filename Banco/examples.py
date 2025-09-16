#!/usr/bin/env python3
"""
Exemplos de uso do PasteDatabase

Este arquivo demonstra como usar o sistema de banco de dados
baseado na API do Paste para diferentes casos de uso.
"""

from paste_database import PasteDatabase
import json

def exemplo_basico():
    """Exemplo básico de operações CRUD"""
    print("=== Exemplo Básico - Operações CRUD ===")
    
    # Inicializar o banco de dados
    db = PasteDatabase()
    
    # 1. CREATE - Criar registros
    print("1. Criando registros...")
    
    # Criar um usuário
    user_data = {
        "nome": "João Silva",
        "email": "joao@email.com",
        "idade": 30,
        "cidade": "São Paulo"
    }
    user_id = db.create("user_001", user_data, {"tipo": "usuario", "status": "ativo"})
    print(f"Usuário criado com ID: {user_id}")
    
    # Criar um produto
    product_data = {
        "nome": "Notebook Gamer",
        "preco": 2500.00,
        "categoria": "Eletrônicos",
        "estoque": 15
    }
    product_id = db.create("product_001", product_data, {"tipo": "produto", "fornecedor": "TechStore"})
    print(f"Produto criado com ID: {product_id}")
    
    # 2. READ - Ler registros
    print("\n2. Lendo registros...")
    
    user_record = db.read("user_001")
    if user_record:
        print(f"Usuário encontrado: {user_record.data['nome']} - {user_record.data['email']}")
    
    product_record = db.read("product_001")
    if product_record:
        print(f"Produto encontrado: {product_record.data['nome']} - R$ {product_record.data['preco']}")
    
    # 3. UPDATE - Atualizar registros
    print("\n3. Atualizando registros...")
    
    # Atualizar preço do produto
    updated_product = product_data.copy()
    updated_product["preco"] = 2200.00
    updated_product["estoque"] = 12
    
    success = db.update("product_001", updated_product)
    if success:
        print("Produto atualizado com sucesso!")
        updated_record = db.read("product_001")
        print(f"Novo preço: R$ {updated_record.data['preco']}")
    
    # 4. LIST - Listar todas as chaves
    print("\n4. Listando todas as chaves...")
    keys = db.list_keys()
    print(f"Chaves no banco: {keys}")
    print(f"Total de registros: {db.count()}")
    
    # 5. SEARCH - Buscar registros
    print("\n5. Buscando registros...")
    results = db.search("São Paulo")
    print(f"Registros que contêm 'São Paulo': {results}")
    
    results = db.search("Notebook", "nome")
    print(f"Produtos que contêm 'Notebook' no nome: {results}")
    
    return db

def exemplo_gerenciar_biblioteca():
    """Exemplo: Sistema de gerenciamento de biblioteca"""
    print("\n=== Exemplo: Sistema de Biblioteca ===")
    
    db = PasteDatabase()
    
    # Adicionar livros
    livros = [
        {
            "key": "livro_001",
            "data": {
                "titulo": "1984",
                "autor": "George Orwell",
                "ano": 1949,
                "genero": "Ficção Científica",
                "disponivel": True,
                "emprestado_para": None
            },
            "metadata": {"categoria": "literatura", "idioma": "português"}
        },
        {
            "key": "livro_002", 
            "data": {
                "titulo": "Dom Casmurro",
                "autor": "Machado de Assis",
                "ano": 1899,
                "genero": "Romance",
                "disponivel": False,
                "emprestado_para": "Maria Santos"
            },
            "metadata": {"categoria": "literatura_brasileira", "idioma": "português"}
        },
        {
            "key": "livro_003",
            "data": {
                "titulo": "The Clean Code",
                "autor": "Robert Martin",
                "ano": 2008,
                "genero": "Técnico",
                "disponivel": True,
                "emprestado_para": None
            },
            "metadata": {"categoria": "programacao", "idioma": "inglês"}
        }
    ]
    
    # Inserir livros no banco
    print("Adicionando livros à biblioteca...")
    for livro in livros:
        try:
            db.create(livro["key"], livro["data"], livro["metadata"])
            print(f"✓ Adicionado: {livro['data']['titulo']}")
        except ValueError as e:
            print(f"✗ Erro ao adicionar {livro['data']['titulo']}: {e}")
    
    # Buscar livros disponíveis
    print("\nLivros disponíveis:")
    all_keys = db.list_keys()
    for key in all_keys:
        record = db.read(key)
        if record and record.data.get("disponivel"):
            print(f"- {record.data['titulo']} por {record.data['autor']}")
    
    # Emprestar um livro
    print("\nEmprestando '1984' para João Silva...")
    livro_1984 = db.read("livro_001")
    if livro_1984:
        livro_data = livro_1984.data.copy()
        livro_data["disponivel"] = False
        livro_data["emprestado_para"] = "João Silva"
        
        success = db.update("livro_001", livro_data)
        if success:
            print("✓ Livro emprestado com sucesso!")
    
    # Buscar livros por gênero
    print("\nLivros de ficção:")
    results = db.search("ficção", "genero")
    for key in results:
        record = db.read(key)
        if record:
            status = "Disponível" if record.data["disponivel"] else f"Emprestado para {record.data['emprestado_para']}"
            print(f"- {record.data['titulo']} ({status})")
    
    return db

def exemplo_loja_online():
    """Exemplo: Sistema de loja online"""
    print("\n=== Exemplo: Loja Online ===")
    
    db = PasteDatabase()
    
    # Produtos da loja
    produtos = [
        {
            "key": "prod_smartphone_001",
            "data": {
                "nome": "iPhone 13 Pro",
                "marca": "Apple",
                "categoria": "Smartphones",
                "preco": 4999.99,
                "estoque": 25,
                "descricao": "iPhone 13 Pro com 128GB",
                "avaliacoes": [5, 5, 4, 5, 4],
                "vendedor": "TechStore"
            }
        },
        {
            "key": "prod_laptop_001",
            "data": {
                "nome": "MacBook Air M1",
                "marca": "Apple", 
                "categoria": "Laptops",
                "preco": 7999.99,
                "estoque": 8,
                "descricao": "MacBook Air com chip M1 e 256GB SSD",
                "avaliacoes": [5, 5, 5, 4, 5],
                "vendedor": "Apple Store"
            }
        },
        {
            "key": "prod_headphone_001",
            "data": {
                "nome": "Sony WH-1000XM4",
                "marca": "Sony",
                "categoria": "Áudio",
                "preco": 1299.99,
                "estoque": 50,
                "descricao": "Fones com cancelamento de ruído",
                "avaliacoes": [5, 4, 5, 5, 4],
                "vendedor": "AudioTech"
            }
        }
    ]
    
    # Adicionar produtos
    print("Adicionando produtos à loja...")
    for produto in produtos:
        try:
            db.create(produto["key"], produto["data"], {"tipo": "produto", "ativo": "sim"})
            print(f"✓ {produto['data']['nome']} - R$ {produto['data']['preco']}")
        except ValueError as e:
            print(f"✗ Erro: {e}")
    
    # Buscar produtos por categoria
    print("\nSmartphones disponíveis:")
    smartphones = db.search("Smartphones", "categoria")
    for key in smartphones:
        produto = db.read(key)
        if produto:
            media_avaliacoes = sum(produto.data["avaliacoes"]) / len(produto.data["avaliacoes"])
            print(f"- {produto.data['nome']} - R$ {produto.data['preco']} (★{media_avaliacoes:.1f})")
    
    # Processar uma venda
    print("\nProcessando venda de iPhone...")
    iphone = db.read("prod_smartphone_001")
    if iphone and iphone.data["estoque"] > 0:
        produto_data = iphone.data.copy()
        produto_data["estoque"] -= 1
        
        # Registrar a venda
        venda_data = {
            "produto_key": "prod_smartphone_001",
            "produto_nome": produto_data["nome"],
            "quantidade": 1,
            "preco_unitario": produto_data["preco"],
            "total": produto_data["preco"],
            "cliente": "João Silva",
            "data_venda": "2024-01-15"
        }
        
        # Atualizar estoque
        db.update("prod_smartphone_001", produto_data)
        
        # Criar registro da venda
        db.create("venda_001", venda_data, {"tipo": "venda", "status": "concluida"})
        
        print(f"✓ Venda registrada! Estoque restante: {produto_data['estoque']}")
    
    return db

def exemplo_analise_dados():
    """Exemplo: Análise de dados armazenados"""
    print("\n=== Exemplo: Análise de Dados ===")
    
    # Usar dados de um dos exemplos anteriores
    db = exemplo_loja_online()
    
    print("\nAnálise dos produtos:")
    
    # Estatísticas gerais
    total_produtos = db.count()
    print(f"Total de produtos cadastrados: {total_produtos}")
    
    # Análise por categoria
    categorias = {}
    valor_total_estoque = 0
    
    for key in db.list_keys():
        record = db.read(key)
        if record and "categoria" in record.data:
            categoria = record.data["categoria"]
            if categoria not in categorias:
                categorias[categoria] = {"count": 0, "valor_total": 0}
            
            categorias[categoria]["count"] += 1
            categorias[categoria]["valor_total"] += record.data["preco"] * record.data["estoque"]
            valor_total_estoque += record.data["preco"] * record.data["estoque"]
    
    print(f"\nValor total do estoque: R$ {valor_total_estoque:,.2f}")
    print("\nProdutos por categoria:")
    for categoria, stats in categorias.items():
        print(f"- {categoria}: {stats['count']} produtos (R$ {stats['valor_total']:,.2f})")
    
    return db

def exemplo_backup_restauracao():
    """Exemplo: Backup e restauração"""
    print("\n=== Exemplo: Backup ===")
    
    # Criar alguns dados
    db = PasteDatabase()
    
    # Dados de teste
    test_data = [
        {"key": "test_001", "data": {"name": "Test 1", "value": 100}},
        {"key": "test_002", "data": {"name": "Test 2", "value": 200}},
        {"key": "test_003", "data": {"name": "Test 3", "value": 300}}
    ]
    
    print("Criando dados de teste...")
    for item in test_data:
        db.create(item["key"], item["data"])
    
    # Fazer backup
    print("Criando backup...")
    backup_id = db.backup("backup_exemplo.json")
    print(f"Backup criado com ID: {backup_id}")
    print(f"URL do backup: https://paste.safone.me/doc/{backup_id}")
    
    return db

if __name__ == "__main__":
    print("🗄️  Demonstração do PasteDatabase")
    print("=" * 50)
    
    try:
        # Executar exemplos
        exemplo_basico()
        exemplo_gerenciar_biblioteca()
        exemplo_loja_online()
        exemplo_analise_dados()
        exemplo_backup_restauracao()
        
        print("\n✅ Todos os exemplos executados com sucesso!")
        print("\nPara usar o banco de dados em seus projetos:")
        print("1. Importe: from paste_database import PasteDatabase")
        print("2. Inicialize: db = PasteDatabase()")
        print("3. Use os métodos CRUD: create(), read(), update(), delete()")
        
    except Exception as e:
        print(f"❌ Erro durante execução: {e}")
        print("Verifique se você tem conexão com a internet e se a API do Paste está funcionando.")
