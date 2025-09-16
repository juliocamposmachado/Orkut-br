#!/usr/bin/env python3
"""
Testes para o PasteDatabase

Script de testes simples para validar as funcionalidades principais
do sistema de banco de dados.
"""

import sys
import time
import traceback
from paste_database import PasteDatabase

class TestResult:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.errors = []
    
    def add_success(self, test_name):
        self.tests_run += 1
        self.tests_passed += 1
        print(f"✅ {test_name}")
    
    def add_failure(self, test_name, error):
        self.tests_run += 1
        self.tests_failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ {test_name}: {error}")
    
    def print_summary(self):
        print(f"\n{'='*50}")
        print(f"RESUMO DOS TESTES")
        print(f"{'='*50}")
        print(f"Total de testes: {self.tests_run}")
        print(f"✅ Passou: {self.tests_passed}")
        print(f"❌ Falhou: {self.tests_failed}")
        
        if self.tests_failed > 0:
            print(f"\nERROS ENCONTRADOS:")
            for error in self.errors:
                print(f"  - {error}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"\nTaxa de sucesso: {success_rate:.1f}%")

def test_basic_crud():
    """Teste básico de operações CRUD"""
    results = TestResult()
    db = PasteDatabase()
    
    test_key = f"test_crud_{int(time.time())}"
    test_data = {
        "nome": "Teste CRUD",
        "valor": 42,
        "ativo": True
    }
    test_metadata = {"tipo": "teste", "categoria": "crud"}
    
    try:
        # Teste CREATE
        try:
            record_id = db.create(test_key, test_data, test_metadata)
            if record_id:
                results.add_success("CREATE - Criar registro")
            else:
                results.add_failure("CREATE - Criar registro", "ID não retornado")
        except Exception as e:
            results.add_failure("CREATE - Criar registro", str(e))
        
        # Teste CREATE duplicado (deve falhar)
        try:
            db.create(test_key, test_data, test_metadata)
            results.add_failure("CREATE - Chave duplicada", "Deveria ter falhado")
        except ValueError:
            results.add_success("CREATE - Rejeitar chave duplicada")
        except Exception as e:
            results.add_failure("CREATE - Rejeitar chave duplicada", str(e))
        
        # Teste READ
        try:
            record = db.read(test_key)
            if record and record.data == test_data:
                results.add_success("READ - Ler registro")
            else:
                results.add_failure("READ - Ler registro", "Dados não coincidem")
        except Exception as e:
            results.add_failure("READ - Ler registro", str(e))
        
        # Teste READ chave inexistente
        try:
            record = db.read("chave_inexistente_123")
            if record is None:
                results.add_success("READ - Chave inexistente")
            else:
                results.add_failure("READ - Chave inexistente", "Deveria retornar None")
        except Exception as e:
            results.add_failure("READ - Chave inexistente", str(e))
        
        # Teste UPDATE
        try:
            updated_data = test_data.copy()
            updated_data["valor"] = 84
            updated_data["modificado"] = True
            
            success = db.update(test_key, updated_data)
            if success:
                # Verificar se foi atualizado
                record = db.read(test_key)
                if record and record.data["valor"] == 84:
                    results.add_success("UPDATE - Atualizar registro")
                else:
                    results.add_failure("UPDATE - Atualizar registro", "Dados não foram atualizados")
            else:
                results.add_failure("UPDATE - Atualizar registro", "Update retornou False")
        except Exception as e:
            results.add_failure("UPDATE - Atualizar registro", str(e))
        
        # Teste UPDATE chave inexistente
        try:
            success = db.update("chave_inexistente_456", {"teste": "valor"})
            if not success:
                results.add_success("UPDATE - Chave inexistente")
            else:
                results.add_failure("UPDATE - Chave inexistente", "Deveria retornar False")
        except Exception as e:
            results.add_failure("UPDATE - Chave inexistente", str(e))
        
        # Teste DELETE
        try:
            success = db.delete(test_key)
            if success:
                # Verificar se foi deletado
                record = db.read(test_key)
                if record is None:
                    results.add_success("DELETE - Deletar registro")
                else:
                    results.add_failure("DELETE - Deletar registro", "Registro ainda existe")
            else:
                results.add_failure("DELETE - Deletar registro", "Delete retornou False")
        except Exception as e:
            results.add_failure("DELETE - Deletar registro", str(e))
        
        # Teste DELETE chave inexistente
        try:
            success = db.delete("chave_inexistente_789")
            if not success:
                results.add_success("DELETE - Chave inexistente")
            else:
                results.add_failure("DELETE - Chave inexistente", "Deveria retornar False")
        except Exception as e:
            results.add_failure("DELETE - Chave inexistente", str(e))
    
    except Exception as e:
        results.add_failure("CRUD - Teste geral", f"Erro inesperado: {str(e)}")
    
    return results

def test_search_and_list():
    """Teste de funcionalidades de busca e listagem"""
    results = TestResult()
    db = PasteDatabase()
    
    # Preparar dados de teste
    test_timestamp = int(time.time())
    test_data = [
        {
            "key": f"search_test_1_{test_timestamp}",
            "data": {"nome": "João Silva", "cidade": "São Paulo", "idade": 30},
            "metadata": {"tipo": "usuario"}
        },
        {
            "key": f"search_test_2_{test_timestamp}",
            "data": {"nome": "Maria Santos", "cidade": "Rio de Janeiro", "idade": 25},
            "metadata": {"tipo": "usuario"}
        },
        {
            "key": f"search_test_3_{test_timestamp}",
            "data": {"nome": "Pedro Oliveira", "cidade": "São Paulo", "idade": 35},
            "metadata": {"tipo": "admin"}
        }
    ]
    
    try:
        # Criar registros de teste
        for item in test_data:
            db.create(item["key"], item["data"], item["metadata"])
        
        # Teste COUNT
        try:
            initial_count = db.count()
            if initial_count >= 3:
                results.add_success("COUNT - Contar registros")
            else:
                results.add_failure("COUNT - Contar registros", f"Contagem muito baixa: {initial_count}")
        except Exception as e:
            results.add_failure("COUNT - Contar registros", str(e))
        
        # Teste LIST_KEYS
        try:
            keys = db.list_keys()
            if isinstance(keys, list) and len(keys) >= 3:
                results.add_success("LIST_KEYS - Listar chaves")
            else:
                results.add_failure("LIST_KEYS - Listar chaves", f"Resultado inválido: {type(keys)}")
        except Exception as e:
            results.add_failure("LIST_KEYS - Listar chaves", str(e))
        
        # Teste SEARCH geral
        try:
            search_results = db.search("São Paulo")
            if len(search_results) >= 2:  # João e Pedro moram em SP
                results.add_success("SEARCH - Busca geral")
            else:
                results.add_failure("SEARCH - Busca geral", f"Resultados insuficientes: {len(search_results)}")
        except Exception as e:
            results.add_failure("SEARCH - Busca geral", str(e))
        
        # Teste SEARCH por campo específico
        try:
            search_results = db.search("Silva", "nome")
            if len(search_results) >= 1:  # João Silva
                results.add_success("SEARCH - Busca por campo")
            else:
                results.add_failure("SEARCH - Busca por campo", f"Nenhum resultado encontrado")
        except Exception as e:
            results.add_failure("SEARCH - Busca por campo", str(e))
        
        # Teste SEARCH sem resultados
        try:
            search_results = db.search("termo_inexistente_xyz")
            if len(search_results) == 0:
                results.add_success("SEARCH - Termo inexistente")
            else:
                results.add_failure("SEARCH - Termo inexistente", f"Encontrou resultados indevidos: {search_results}")
        except Exception as e:
            results.add_failure("SEARCH - Termo inexistente", str(e))
        
        # Limpar dados de teste
        for item in test_data:
            try:
                db.delete(item["key"])
            except:
                pass
    
    except Exception as e:
        results.add_failure("SEARCH - Teste geral", f"Erro inesperado: {str(e)}")
    
    return results

def test_backup():
    """Teste de funcionalidade de backup"""
    results = TestResult()
    db = PasteDatabase()
    
    test_timestamp = int(time.time())
    test_key = f"backup_test_{test_timestamp}"
    
    try:
        # Criar alguns dados para backup
        db.create(test_key, {"teste": "backup", "timestamp": test_timestamp})
        
        # Teste BACKUP
        try:
            backup_filename = f"test_backup_{test_timestamp}.json"
            backup_id = db.backup(backup_filename)
            
            if backup_id and len(backup_id) > 5:  # IDs do Paste são strings não-vazias
                results.add_success("BACKUP - Criar backup")
                print(f"  📄 Backup ID: {backup_id}")
            else:
                results.add_failure("BACKUP - Criar backup", f"ID inválido: {backup_id}")
        except Exception as e:
            results.add_failure("BACKUP - Criar backup", str(e))
        
        # Teste BACKUP automático (sem filename)
        try:
            backup_id = db.backup()
            if backup_id and len(backup_id) > 5:
                results.add_success("BACKUP - Backup automático")
            else:
                results.add_failure("BACKUP - Backup automático", f"ID inválido: {backup_id}")
        except Exception as e:
            results.add_failure("BACKUP - Backup automático", str(e))
        
        # Limpar dados de teste
        try:
            db.delete(test_key)
        except:
            pass
    
    except Exception as e:
        results.add_failure("BACKUP - Teste geral", f"Erro inesperado: {str(e)}")
    
    return results

def test_edge_cases():
    """Teste de casos extremos"""
    results = TestResult()
    db = PasteDatabase()
    
    test_timestamp = int(time.time())
    
    try:
        # Teste com dados vazios
        try:
            test_key = f"empty_test_{test_timestamp}"
            db.create(test_key, {})
            record = db.read(test_key)
            if record and record.data == {}:
                results.add_success("EDGE - Dados vazios")
            else:
                results.add_failure("EDGE - Dados vazios", "Dados não preservados")
            db.delete(test_key)
        except Exception as e:
            results.add_failure("EDGE - Dados vazios", str(e))
        
        # Teste com dados complexos
        try:
            test_key = f"complex_test_{test_timestamp}"
            complex_data = {
                "lista": [1, 2, 3, "texto"],
                "nested": {"a": {"b": {"c": "deep"}}},
                "unicode": "áéíóú çñ 🚀",
                "numbers": {"int": 42, "float": 3.14159, "negative": -100}
            }
            
            db.create(test_key, complex_data)
            record = db.read(test_key)
            if record and record.data == complex_data:
                results.add_success("EDGE - Dados complexos")
            else:
                results.add_failure("EDGE - Dados complexos", "Dados não preservados corretamente")
            db.delete(test_key)
        except Exception as e:
            results.add_failure("EDGE - Dados complexos", str(e))
        
        # Teste com chaves especiais
        try:
            special_keys = [
                f"key-with-dashes_{test_timestamp}",
                f"key_with_underscores_{test_timestamp}",
                f"key.with.dots_{test_timestamp}",
                f"123numeric_start_{test_timestamp}"
            ]
            
            for key in special_keys:
                db.create(key, {"test": "special_key"})
                record = db.read(key)
                if not record:
                    results.add_failure("EDGE - Chaves especiais", f"Falha com chave: {key}")
                    break
                db.delete(key)
            else:
                results.add_success("EDGE - Chaves especiais")
                
        except Exception as e:
            results.add_failure("EDGE - Chaves especiais", str(e))
    
    except Exception as e:
        results.add_failure("EDGE - Teste geral", f"Erro inesperado: {str(e)}")
    
    return results

def run_all_tests():
    """Executa todos os testes"""
    print("🧪 Iniciando testes do PasteDatabase")
    print("=" * 50)
    
    # Verificar conexão básica
    print("🌐 Verificando conexão com a API...")
    try:
        db = PasteDatabase()
        test_key = f"connection_test_{int(time.time())}"
        db.create(test_key, {"test": "connection"})
        db.delete(test_key)
        print("✅ Conexão OK")
    except Exception as e:
        print(f"❌ Falha na conexão: {e}")
        print("Verifique sua conexão com a internet e tente novamente.")
        return
    
    print("\n🔧 Executando testes...")
    print("-" * 30)
    
    # Executar conjuntos de testes
    all_results = TestResult()
    
    test_suites = [
        ("CRUD Operations", test_basic_crud),
        ("Search & List", test_search_and_list),
        ("Backup", test_backup),
        ("Edge Cases", test_edge_cases)
    ]
    
    for suite_name, test_func in test_suites:
        print(f"\n📋 {suite_name}:")
        try:
            suite_results = test_func()
            all_results.tests_run += suite_results.tests_run
            all_results.tests_passed += suite_results.tests_passed
            all_results.tests_failed += suite_results.tests_failed
            all_results.errors.extend(suite_results.errors)
        except Exception as e:
            print(f"❌ Erro fatal no conjunto {suite_name}: {e}")
            traceback.print_exc()
            all_results.tests_run += 1
            all_results.tests_failed += 1
            all_results.errors.append(f"{suite_name}: {e}")
    
    # Resumo final
    all_results.print_summary()
    
    if all_results.tests_failed == 0:
        print(f"\n🎉 Todos os testes passaram! O PasteDatabase está funcionando corretamente.")
    else:
        print(f"\n⚠️  Alguns testes falharam. Verifique os erros acima.")
    
    print(f"\n💡 Dica: Execute 'python examples.py' para ver exemplos práticos de uso.")

if __name__ == "__main__":
    run_all_tests()
