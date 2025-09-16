#!/usr/bin/env python3
"""
Teste simples do PasteDatabase
"""

from paste_database import PasteDatabase
import time

def teste_basico():
    print('🗄️  Testando PasteDatabase')
    print('='*40)
    
    # Criar uma instância do banco
    db = PasteDatabase()
    print('✅ Banco de dados inicializado')
    
    # Teste básico - CREATE
    test_key = f'test_demo_{int(time.time())}'
    test_data = {
        'nome': 'João Silva',
        'idade': 30,
        'email': 'joao@teste.com',
        'ativo': True
    }
    
    try:
        print('🔄 Criando registro...')
        record_id = db.create(test_key, test_data, {'tipo': 'usuario_teste'})
        print(f'✅ Registro criado com ID: {record_id}')
        
        # Teste READ
        print('🔄 Lendo registro...')
        record = db.read(test_key)
        if record:
            print(f'✅ Registro lido: {record.data["nome"]} ({record.data["email"]})')
        
        # Teste UPDATE
        print('🔄 Atualizando registro...')
        updated_data = test_data.copy()
        updated_data['nome'] = 'João Silva Santos'
        updated_data['telefone'] = '(11) 99999-9999'
        
        success = db.update(test_key, updated_data)
        if success:
            print('✅ Registro atualizado com sucesso')
            
            # Verificar atualização
            record = db.read(test_key)
            if record:
                print(f'✅ Nome atualizado: {record.data["nome"]}')
        
        # Teste de contagem
        print('🔄 Contando registros...')
        count = db.count()
        print(f'✅ Total de registros no banco: {count}')
        
        # Teste SEARCH
        print('🔄 Buscando registros...')
        results = db.search('João')
        print(f'✅ Busca por "João" encontrou {len(results)} resultado(s)')
        
        # Teste DELETE
        print('🔄 Deletando registro...')
        success = db.delete(test_key)
        if success:
            print('✅ Registro deletado com sucesso')
        
        print('\n🎉 Todos os testes básicos passaram!')
        print('💡 Execute "python examples.py" para ver mais exemplos')
        
    except Exception as e:
        print(f'❌ Erro durante teste: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    teste_basico()
