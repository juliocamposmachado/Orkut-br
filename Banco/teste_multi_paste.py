#!/usr/bin/env python3
"""
Teste do MultiPasteDatabase - Banco de dados usando múltiplos serviços de pastebin
"""

from multi_paste_database import MultiPasteDatabase
import time

def teste_completo():
    print('🗄️  Testando MultiPasteDatabase')
    print('='*50)
    
    try:
        # Criar instância - tentará automaticamente encontrar um serviço funcionando
        db = MultiPasteDatabase(preferred_service="dpaste")
        
        # Mostrar informações do serviço
        info = db.get_info()
        print(f'🌐 Serviço: {info["service"]} ({info["service_url"]})')
        print(f'📊 Serviços disponíveis: {", ".join(info["available_services"])}')
        
        # Teste 1: CREATE
        print('\n🔄 1. Testando CREATE...')
        test_key = f'demo_user_{int(time.time())}'
        test_data = {
            'nome': 'João Silva',
            'idade': 30,
            'email': 'joao@teste.com',
            'cidade': 'São Paulo',
            'telefone': '(11) 98765-4321',
            'ativo': True
        }
        
        record_id = db.create(test_key, test_data, {'tipo': 'usuario', 'origem': 'demo'})
        print(f'✅ Registro criado com ID: {record_id}')
        
        # Teste 2: READ
        print('\n🔄 2. Testando READ...')
        record = db.read(test_key)
        if record:
            print(f'✅ Registro lido: {record.data["nome"]} ({record.data["email"]})')
            print(f'   📅 Criado em: {time.ctime(record.created_at)}')
            print(f'   🏷️  Metadados: {record.metadata}')
        else:
            print('❌ Erro ao ler registro')
            
        # Teste 3: Adicionar mais registros
        print('\n🔄 3. Adicionando mais registros...')
        registros_extras = [
            {
                'key': f'user_maria_{int(time.time())}',
                'data': {
                    'nome': 'Maria Santos',
                    'idade': 28,
                    'email': 'maria@teste.com',
                    'cidade': 'Rio de Janeiro',
                    'ativo': True
                }
            },
            {
                'key': f'user_pedro_{int(time.time())}', 
                'data': {
                    'nome': 'Pedro Oliveira',
                    'idade': 35,
                    'email': 'pedro@teste.com',
                    'cidade': 'São Paulo',
                    'ativo': False
                }
            }
        ]
        
        for registro in registros_extras:
            db.create(registro['key'], registro['data'], {'tipo': 'usuario'})
            print(f'   ✓ {registro["data"]["nome"]}')
        
        # Teste 4: UPDATE
        print('\n🔄 4. Testando UPDATE...')
        updated_data = test_data.copy()
        updated_data['nome'] = 'João Silva Santos'
        updated_data['cargo'] = 'Desenvolvedor'
        updated_data['salario'] = 5000.00
        
        success = db.update(test_key, updated_data, {'tipo': 'usuario', 'status': 'atualizado'})
        if success:
            print('✅ Registro atualizado com sucesso')
            
            # Verificar atualização
            record = db.read(test_key)
            if record:
                print(f'   ✓ Nome: {record.data["nome"]}')
                print(f'   ✓ Cargo: {record.data.get("cargo", "N/A")}')
                print(f'   ✓ Salário: R$ {record.data.get("salario", 0):,.2f}')
                print(f'   📅 Atualizado em: {time.ctime(record.updated_at)}')
        
        # Teste 5: LIST e COUNT
        print('\n🔄 5. Testando LIST e COUNT...')
        keys = db.list_keys()
        count = db.count()
        print(f'✅ Total de registros: {count}')
        print(f'✅ Chaves: {keys}')
        
        # Teste 6: SEARCH
        print('\n🔄 6. Testando SEARCH...')
        
        # Busca geral
        results = db.search('São Paulo')
        print(f'✅ Busca por "São Paulo": {len(results)} resultado(s) - {results}')
        
        # Busca por campo específico
        results = db.search('Silva', 'nome')
        print(f'✅ Busca por "Silva" no campo nome: {results}')
        
        # Busca por email
        results = db.search('.com', 'email')
        print(f'✅ Emails com ".com": {len(results)} resultado(s)')
        
        # Teste 7: Mostrar todos os dados
        print('\n📋 7. Listagem completa dos dados:')
        for i, key in enumerate(db.list_keys(), 1):
            record = db.read(key)
            if record:
                status = "Ativo" if record.data.get('ativo') else "Inativo"
                print(f'   {i}. {record.data["nome"]} ({record.data["email"]}) - {status}')
                print(f'      📍 {record.data["cidade"]} | 👤 {record.data["idade"]} anos')
                if 'cargo' in record.data:
                    print(f'      💼 {record.data["cargo"]} | 💰 R$ {record.data.get("salario", 0):,.2f}')
                
        # Teste 8: BACKUP
        print('\n🔄 8. Testando BACKUP...')
        backup_id = db.backup('demo_backup_multi.json')
        print(f'✅ Backup criado com ID: {backup_id}')
        
        # Teste 9: Informações finais
        print('\n📊 9. Informações finais:')
        final_info = db.get_info()
        for key, value in final_info.items():
            print(f'   {key}: {value}')
        
        print('\n🎉 Todos os testes passaram com sucesso!')
        print(f'💡 Os dados estão armazenados em: {info["service_url"]}')
        print('💡 Execute este script novamente para ver a persistência dos dados')
        
    except Exception as e:
        print(f'❌ Erro durante teste: {e}')
        import traceback
        traceback.print_exc()

def exemplo_loja():
    """Exemplo prático: Sistema de loja usando o banco de dados"""
    print('\n' + '='*60)
    print('🛒 EXEMPLO PRÁTICO: Sistema de Loja Online')
    print('='*60)
    
    try:
        db = MultiPasteDatabase(preferred_service="hastebin")
        
        # Produtos para adicionar
        produtos = [
            {
                'nome': 'Smartphone Samsung Galaxy',
                'categoria': 'Eletrônicos',
                'preco': 1299.99,
                'estoque': 15,
                'descricao': 'Smartphone com 128GB e câmera de 64MP'
            },
            {
                'nome': 'Notebook Dell Inspiron',
                'categoria': 'Informática',
                'preco': 2499.90,
                'estoque': 8,
                'descricao': 'Notebook com Intel i5, 8GB RAM, 256GB SSD'
            },
            {
                'nome': 'Fone JBL Bluetooth',
                'categoria': 'Áudio',
                'preco': 199.99,
                'estoque': 25,
                'descricao': 'Fone sem fio com cancelamento de ruído'
            }
        ]
        
        # Adicionar produtos
        print('\n📦 Adicionando produtos à loja...')
        for i, produto in enumerate(produtos, 1):
            try:
                key = f'produto_{i:03d}_{produto["nome"].lower().replace(" ", "_")}'
                db.create(key, produto, {'tipo': 'produto', 'status': 'ativo'})
                print(f'   ✓ {produto["nome"]} - R$ {produto["preco"]:.2f}')
            except ValueError:
                print(f'   ⚠️  {produto["nome"]} já existe')
        
        # Listar produtos por categoria
        print('\n🏷️  Produtos por categoria:')
        categorias = {}
        for key in db.list_keys():
            record = db.read(key)
            if record and 'categoria' in record.data:
                cat = record.data['categoria']
                if cat not in categorias:
                    categorias[cat] = []
                categorias[cat].append(record.data)
        
        for categoria, prods in categorias.items():
            print(f'\n   📂 {categoria}:')
            for prod in prods:
                print(f'      • {prod["nome"]} - R$ {prod["preco"]:.2f} ({prod["estoque"]} unidades)')
        
        # Simular vendas
        print('\n💳 Processando vendas...')
        vendas = [
            {'produto': 'produto_001_smartphone_samsung_galaxy', 'quantidade': 2, 'cliente': 'João Silva'},
            {'produto': 'produto_003_fone_jbl_bluetooth', 'quantidade': 1, 'cliente': 'Maria Santos'}
        ]
        
        for venda in vendas:
            produto = db.read(venda['produto'])
            if produto and produto.data['estoque'] >= venda['quantidade']:
                # Reduzir estoque
                produto_data = produto.data.copy()
                produto_data['estoque'] -= venda['quantidade']
                
                db.update(venda['produto'], produto_data)
                
                # Registrar venda
                venda_key = f'venda_{int(time.time())}_{venda["cliente"].lower().replace(" ", "_")}'
                venda_data = {
                    'produto_nome': produto.data['nome'],
                    'quantidade': venda['quantidade'],
                    'preco_unitario': produto.data['preco'],
                    'total': produto.data['preco'] * venda['quantidade'],
                    'cliente': venda['cliente'],
                    'data_venda': time.strftime('%Y-%m-%d %H:%M:%S')
                }
                
                db.create(venda_key, venda_data, {'tipo': 'venda', 'status': 'concluida'})
                
                print(f'   ✓ {venda["quantidade"]}x {produto.data["nome"]} para {venda["cliente"]}')
                print(f'     💰 Total: R$ {venda_data["total"]:.2f}')
        
        # Relatório de estoque
        print('\n📊 Relatório de estoque atualizado:')
        for key in db.list_keys():
            record = db.read(key)
            if record and record.metadata.get('tipo') == 'produto':
                estoque = record.data['estoque']
                status = "⚠️ BAIXO" if estoque < 10 else "✅ OK"
                print(f'   • {record.data["nome"]}: {estoque} unidades {status}')
        
        # Relatório de vendas
        print('\n📈 Relatório de vendas:')
        total_vendas = 0
        for key in db.list_keys():
            record = db.read(key)
            if record and record.metadata.get('tipo') == 'venda':
                print(f'   • {record.data["produto_nome"]} - {record.data["cliente"]} - R$ {record.data["total"]:.2f}')
                total_vendas += record.data['total']
        
        print(f'\n💰 Total em vendas: R$ {total_vendas:.2f}')
        
        print('\n✅ Exemplo de loja concluído!')
        
    except Exception as e:
        print(f'❌ Erro no exemplo da loja: {e}')

if __name__ == "__main__":
    teste_completo()
    exemplo_loja()
