#!/usr/bin/env python3
"""
🧪 TESTE SISTEMA PASTEDB AUTH
============================

Script para testar o sistema completo de autenticação PasteDB
"""

import sys
import json
import time
from user_auth_interface import handle_test, handle_register, handle_login, handle_validate, handle_logout, handle_stats

def test_connectivity():
    """Testa conectividade básica com dpaste.org"""
    print("🔍 Testando conectividade com dpaste.org...")
    
    result = handle_test()
    if result["success"]:
        print(f"✅ Conectividade OK!")
        print(f"   Serviço: {result['service']}")
        print(f"   URL: {result['service_url']}")
        print(f"   Teste ID: {result['test_paste_id']}")
        return True
    else:
        print(f"❌ Falha na conectividade: {result.get('error', 'Erro desconhecido')}")
        return False

def test_user_registration():
    """Testa registro de usuário"""
    print("\n📝 Testando registro de usuário...")
    
    # Dados de teste
    email = f"teste{int(time.time())}@exemplo.com"
    password = "minhasenha123"
    username = f"user{int(time.time())}"
    display_name = "Usuário Teste PasteDB"
    
    result = handle_register(email, password, username, display_name)
    
    if result["success"]:
        print(f"✅ Usuário registrado com sucesso!")
        print(f"   Username: {result['profile']['username']}")
        print(f"   Email: {email}")
        print(f"   Token: {result['session_token'][:16]}...")
        return result
    else:
        print(f"❌ Falha no registro: {result.get('error', 'Erro desconhecido')}")
        return None

def test_user_login(email, password):
    """Testa login do usuário"""
    print(f"\n🔐 Testando login com {email}...")
    
    result = handle_login(email, password)
    
    if result["success"]:
        print(f"✅ Login realizado com sucesso!")
        print(f"   Username: {result['profile']['username']}")
        print(f"   Token: {result['session_token'][:16]}...")
        return result
    else:
        print(f"❌ Falha no login: {result.get('error', 'Erro desconhecido')}")
        return None

def test_session_validation(session_token):
    """Testa validação de sessão"""
    print(f"\n🔑 Testando validação de sessão {session_token[:16]}...")
    
    result = handle_validate(session_token)
    
    if result["success"]:
        print(f"✅ Sessão válida!")
        print(f"   Username: {result['profile']['username']}")
        print(f"   Email: {result['user']['email']}")
        return True
    else:
        print(f"❌ Sessão inválida: {result.get('error', 'Erro desconhecido')}")
        return False

def test_logout(session_token):
    """Testa logout"""
    print(f"\n👋 Testando logout da sessão {session_token[:16]}...")
    
    result = handle_logout(session_token)
    
    if result["success"]:
        print(f"✅ Logout realizado com sucesso!")
        return True
    else:
        print(f"❌ Falha no logout: {result.get('error', 'Erro desconhecido')}")
        return False

def test_session_after_logout(session_token):
    """Testa se sessão está realmente invalidada após logout"""
    print(f"\n🔒 Verificando se sessão foi invalidada...")
    
    result = handle_validate(session_token)
    
    if not result["success"]:
        print(f"✅ Sessão corretamente invalidada!")
        return True
    else:
        print(f"❌ ERRO: Sessão ainda está válida após logout!")
        return False

def show_stats():
    """Mostra estatísticas do banco"""
    print(f"\n📊 Estatísticas do banco PasteDB:")
    
    result = handle_stats()
    
    if result["success"]:
        stats = result["stats"]
        print(f"   Total de usuários: {stats['total_users']}")
        print(f"   Emails cadastrados: {stats['total_emails']}")
        print(f"   Sessões ativas: {stats['active_sessions']}")
        print(f"   Serviço: {stats['service']} ({stats['service_url']})")
        if stats.get('index_paste_id'):
            print(f"   Índice: {stats['service_url']}/{stats['index_paste_id']}")
    else:
        print(f"   Erro ao obter estatísticas: {result.get('error')}")

def main():
    """Executa todos os testes"""
    print("🚀 INICIANDO TESTES DO SISTEMA PASTEDB AUTH")
    print("=" * 50)
    
    # Teste 1: Conectividade
    if not test_connectivity():
        print("\n❌ FALHA CRÍTICA: Sem conectividade com dpaste.org")
        return False
    
    # Teste 2: Registro
    user_data = test_user_registration()
    if not user_data:
        print("\n❌ FALHA CRÍTICA: Não foi possível registrar usuário")
        return False
    
    email = user_data["user"]["email"]
    password = "minhasenha123"  # A senha usada no teste
    session_token = user_data["session_token"]
    
    # Teste 3: Validação de sessão (deve funcionar)
    if not test_session_validation(session_token):
        print("\n❌ FALHA: Sessão não é válida após registro")
        return False
    
    # Teste 4: Login (deve funcionar com as mesmas credenciais)
    login_data = test_user_login(email, password)
    if not login_data:
        print("\n❌ FALHA: Não foi possível fazer login")
        return False
    
    # Teste 5: Logout
    if not test_logout(session_token):
        print("\n❌ FALHA: Não foi possível fazer logout")
        return False
    
    # Teste 6: Verificar se sessão foi invalidada
    if not test_session_after_logout(session_token):
        print("\n❌ FALHA CRÍTICA: Logout não invalidou a sessão!")
        return False
    
    # Mostrar estatísticas finais
    show_stats()
    
    print("\n" + "=" * 50)
    print("✅ TODOS OS TESTES PASSARAM! Sistema PasteDB funcionando corretamente.")
    print(f"🌐 Acesse https://dpaste.org para ver os dados armazenados")
    print("🎉 Seu sistema de autenticação descentralizado está funcionando!")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Teste interrompido pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n💥 ERRO CRÍTICO: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
