#!/usr/bin/env python3
"""
🔐 ORKUT USER AUTH INTERFACE - Interface de Autenticação PasteDB
===============================================================

Script CLI para gerenciar autenticação de usuários usando
banco descentralizado PasteDB (dpaste.org)
"""

import sys
import json
import time
from typing import Optional, Dict, Any
from user_database import UserDatabase

# Instância global do banco de usuários
user_db: Optional[UserDatabase] = None

def get_user_database() -> UserDatabase:
    """Retorna instância global do banco de usuários"""
    global user_db
    if user_db is None:
        # Usar dpaste.org como serviço preferencial
        user_db = UserDatabase('dpaste')
        print(f"✅ UserDatabase inicializado com serviço: dpaste.org", file=sys.stderr)
    return user_db

def handle_register(email: str, password: str, username: str, display_name: str, 
                   ip_address: str = None, user_agent: str = None) -> Dict[str, Any]:
    """
    Registra um novo usuário
    
    Args:
        email: Email do usuário
        password: Senha em texto plano
        username: Nome de usuário único
        display_name: Nome de exibição
        ip_address: IP do cliente
        user_agent: User agent do cliente
        
    Returns:
        Dict com resultado da operação
    """
    try:
        db = get_user_database()
        
        # Criar usuário
        user_id = db.create_user(email, password, username, display_name)
        
        # Buscar dados do usuário criado
        user_data = db.get_user_by_username(username)
        if not user_data:
            return {
                "success": False,
                "error": "Erro ao recuperar dados do usuário criado"
            }
        
        # Criar sessão automaticamente
        session_token = db.create_session(user_id, ip_address, user_agent)
        
        # Preparar dados para retorno (compatível com frontend)
        user_result = {
            "id": user_data["id"],
            "email": email,
            "email_confirmed_at": user_data.get("email_confirmed_at"),
            "created_at": user_data.get("created_at")
        }
        
        profile_result = {
            "id": user_data["id"],
            "username": user_data["username"],
            "display_name": user_data["display_name"],
            "photo_url": user_data.get("photo_url"),
            "relationship": user_data.get("relationship"),
            "location": user_data.get("location"),
            "birthday": user_data.get("birthday"),
            "bio": user_data.get("bio"),
            "fans_count": user_data.get("fans_count", 0),
            "created_at": user_data.get("created_at"),
            "email_confirmed": user_data.get("email_confirmed", False),
            "email_confirmed_at": user_data.get("email_confirmed_at"),
            "role": user_data.get("role", "user")
        }
        
        return {
            "success": True,
            "user": user_result,
            "profile": profile_result,
            "session_token": session_token,
            "message": f"Usuário {username} criado com sucesso"
        }
        
    except ValueError as e:
        return {
            "success": False,
            "error": str(e)
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro interno: {str(e)}"
        }

def handle_login(email: str, password: str, ip_address: str = None, 
                user_agent: str = None) -> Dict[str, Any]:
    """
    Autentica usuário
    
    Args:
        email: Email do usuário
        password: Senha em texto plano
        ip_address: IP do cliente
        user_agent: User agent do cliente
        
    Returns:
        Dict com resultado da operação
    """
    try:
        db = get_user_database()
        
        # Autenticar usuário
        user_data = db.authenticate_user(email, password)
        if not user_data:
            return {
                "success": False,
                "error": "Email ou senha incorretos"
            }
        
        # Criar nova sessão
        session_token = db.create_session(user_data["id"], ip_address, user_agent)
        
        # Preparar dados para retorno
        user_result = {
            "id": user_data["id"],
            "email": user_data["email"],
            "email_confirmed_at": user_data.get("email_confirmed_at"),
            "created_at": user_data.get("created_at")
        }
        
        profile_result = {
            "id": user_data["id"],
            "username": user_data["username"],
            "display_name": user_data["display_name"],
            "photo_url": user_data.get("photo_url"),
            "relationship": user_data.get("relationship"),
            "location": user_data.get("location"),
            "birthday": user_data.get("birthday"),
            "bio": user_data.get("bio"),
            "fans_count": user_data.get("fans_count", 0),
            "created_at": user_data.get("created_at"),
            "email_confirmed": user_data.get("email_confirmed", False),
            "email_confirmed_at": user_data.get("email_confirmed_at"),
            "role": user_data.get("role", "user")
        }
        
        return {
            "success": True,
            "user": user_result,
            "profile": profile_result,
            "session_token": session_token,
            "message": f"Login realizado para {user_data['username']}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro na autenticação: {str(e)}"
        }

def handle_validate(session_token: str) -> Dict[str, Any]:
    """
    Valida token de sessão
    
    Args:
        session_token: Token da sessão
        
    Returns:
        Dict com resultado da validação
    """
    try:
        db = get_user_database()
        
        # Validar sessão
        user_data = db.validate_session(session_token)
        if not user_data:
            return {
                "success": False,
                "error": "Sessão inválida ou expirada"
            }
        
        # Preparar dados para retorno
        user_result = {
            "id": user_data["id"],
            "email": user_data["email"],
            "email_confirmed_at": user_data.get("email_confirmed_at"),
            "created_at": user_data.get("created_at")
        }
        
        profile_result = {
            "id": user_data["id"],
            "username": user_data["username"],
            "display_name": user_data["display_name"],
            "photo_url": user_data.get("photo_url"),
            "relationship": user_data.get("relationship"),
            "location": user_data.get("location"),
            "birthday": user_data.get("birthday"),
            "bio": user_data.get("bio"),
            "fans_count": user_data.get("fans_count", 0),
            "created_at": user_data.get("created_at"),
            "email_confirmed": user_data.get("email_confirmed", False),
            "email_confirmed_at": user_data.get("email_confirmed_at"),
            "role": user_data.get("role", "user")
        }
        
        return {
            "success": True,
            "user": user_result,
            "profile": profile_result,
            "message": f"Sessão válida para {user_data['username']}"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro na validação: {str(e)}"
        }

def handle_logout(session_token: str) -> Dict[str, Any]:
    """
    Invalida sessão (logout)
    
    Args:
        session_token: Token da sessão
        
    Returns:
        Dict com resultado da operação
    """
    try:
        db = get_user_database()
        
        # Invalidar sessão
        success = db.invalidate_session(session_token)
        
        return {
            "success": success,
            "message": "Logout realizado" if success else "Sessão não encontrada"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro no logout: {str(e)}"
        }

def handle_stats() -> Dict[str, Any]:
    """
    Retorna estatísticas do banco
    
    Returns:
        Dict com estatísticas
    """
    try:
        db = get_user_database()
        stats = db.get_database_stats()
        
        return {
            "success": True,
            "stats": stats
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro ao obter estatísticas: {str(e)}"
        }

def handle_test() -> Dict[str, Any]:
    """
    Testa conectividade com PasteDB
    
    Returns:
        Dict com resultado do teste
    """
    try:
        db = get_user_database()
        
        # Teste simples de conectividade
        test_key = f"test_{int(time.time())}"
        test_data = {"test": True, "timestamp": int(time.time())}
        
        # Criar teste
        paste_id = db.create(test_key, test_data, {"type": "connectivity_test"})
        
        # Ler teste
        record = db.read(test_key)
        
        # Limpar teste
        db.delete(test_key)
        
        if record and record.data.get("test"):
            return {
                "success": True,
                "service": db.current_service.name,
                "service_url": db.current_service.base_url,
                "test_paste_id": paste_id,
                "message": "Conectividade com PasteDB testada com sucesso"
            }
        else:
            return {
                "success": False,
                "error": "Falha no teste de conectividade"
            }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Erro no teste: {str(e)}"
        }

def main():
    """Função principal que processa comandos via CLI"""
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Nenhuma operação especificada"}))
        sys.exit(1)
    
    operation = sys.argv[1].lower()
    result = None
    
    try:
        if operation == "register":
            if len(sys.argv) < 6:
                raise ValueError("Register requer: email, password, username, displayName")
            email = sys.argv[2]
            password = sys.argv[3]
            username = sys.argv[4]
            display_name = sys.argv[5]
            ip_address = sys.argv[6] if len(sys.argv) > 6 else None
            user_agent = sys.argv[7] if len(sys.argv) > 7 else None
            
            result = handle_register(email, password, username, display_name, ip_address, user_agent)
            
        elif operation == "login":
            if len(sys.argv) < 4:
                raise ValueError("Login requer: email, password")
            email = sys.argv[2]
            password = sys.argv[3]
            ip_address = sys.argv[4] if len(sys.argv) > 4 else None
            user_agent = sys.argv[5] if len(sys.argv) > 5 else None
            
            result = handle_login(email, password, ip_address, user_agent)
            
        elif operation == "validate":
            if len(sys.argv) < 3:
                raise ValueError("Validate requer: session_token")
            session_token = sys.argv[2]
            
            result = handle_validate(session_token)
            
        elif operation == "logout":
            if len(sys.argv) < 3:
                raise ValueError("Logout requer: session_token")
            session_token = sys.argv[2]
            
            result = handle_logout(session_token)
            
        elif operation == "stats":
            result = handle_stats()
            
        elif operation == "test":
            result = handle_test()
            
        else:
            result = {"success": False, "error": f"Operação desconhecida: {operation}"}
            
    except Exception as e:
        result = {"success": False, "error": f"Erro na operação: {str(e)}"}
    
    # Retornar resultado como JSON
    if result is not None:
        print(json.dumps(result, ensure_ascii=False, indent=None))
    else:
        print(json.dumps({"success": False, "error": "Nenhum resultado"}))

if __name__ == "__main__":
    main()
