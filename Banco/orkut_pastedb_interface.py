#!/usr/bin/env python3
"""
🚀 ORKUT PASTEDB INTERFACE - Interface Python para Node.js
===========================================================

Este script atua como uma ponte entre o adaptador TypeScript
e o sistema PasteDatabase Python, permitindo operações
transparentes do banco de dados descentralizado.
"""

import sys
import json
import os
from typing import Optional, Dict, Any, List
from multi_paste_database import MultiPasteDatabase

# Configuração global do banco
db: Optional[MultiPasteDatabase] = None

def get_database() -> MultiPasteDatabase:
    """Retorna a instância global do banco de dados"""
    global db
    if db is None:
        # Usar serviço preferencial ou tentar múltiplos
        preferred_service = os.environ.get('PASTEDB_SERVICE', 'dpaste')
        db = MultiPasteDatabase(preferred_service)
        print(f"✅ PasteDB inicializado com serviço: {preferred_service}", file=sys.stderr)
    return db

def handle_create(key: str, data_json: str, metadata_json: str = None) -> Dict[str, Any]:
    """Criar um novo registro"""
    try:
        data = json.loads(data_json)
        metadata = json.loads(metadata_json) if metadata_json else {}
        
        database = get_database()
        paste_id = database.create(key, data, metadata)
        
        return {
            "success": True,
            "paste_id": paste_id,
            "key": key
        }
    except ValueError as e:
        return {"success": False, "error": f"Validation error: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Create error: {str(e)}"}

def handle_read(key: str) -> Optional[Dict[str, Any]]:
    """Ler um registro"""
    try:
        database = get_database()
        record = database.read(key)
        
        if record:
            return {
                "id": record.id,
                "data": record.data,
                "created_at": record.created_at,
                "updated_at": record.updated_at,
                "metadata": record.metadata
            }
        return None
    except Exception as e:
        print(f"Read error: {str(e)}", file=sys.stderr)
        return None

def handle_update(key: str, data_json: str, metadata_json: str = None) -> Dict[str, Any]:
    """Atualizar um registro existente"""
    try:
        data = json.loads(data_json)
        metadata = json.loads(metadata_json) if metadata_json else None
        
        database = get_database()
        success = database.update(key, data, metadata)
        
        return {
            "success": success,
            "key": key
        }
    except Exception as e:
        return {"success": False, "error": f"Update error: {str(e)}"}

def handle_delete(key: str) -> Dict[str, Any]:
    """Deletar um registro"""
    try:
        database = get_database()
        success = database.delete(key)
        
        return {
            "success": success,
            "key": key
        }
    except Exception as e:
        return {"success": False, "error": f"Delete error: {str(e)}"}

def handle_list_keys() -> List[str]:
    """Listar todas as chaves"""
    try:
        database = get_database()
        return database.list_keys()
    except Exception as e:
        print(f"List keys error: {str(e)}", file=sys.stderr)
        return []

def handle_search(query: str, field: str = None) -> List[str]:
    """Buscar registros"""
    try:
        database = get_database()
        return database.search(query, field)
    except Exception as e:
        print(f"Search error: {str(e)}", file=sys.stderr)
        return []

def handle_count() -> int:
    """Contar registros"""
    try:
        database = get_database()
        return database.count()
    except Exception as e:
        print(f"Count error: {str(e)}", file=sys.stderr)
        return 0

def handle_backup(filename: str = None) -> Dict[str, Any]:
    """Criar backup"""
    try:
        database = get_database()
        backup_id = database.backup(filename)
        
        return {
            "success": True,
            "backup_id": backup_id,
            "backup_url": f"{database.current_service.base_url}/{backup_id}",
            "filename": filename
        }
    except Exception as e:
        return {"success": False, "error": f"Backup error: {str(e)}"}

def handle_get_info() -> Dict[str, Any]:
    """Obter informações do banco"""
    try:
        database = get_database()
        return database.get_info()
    except Exception as e:
        print(f"Get info error: {str(e)}", file=sys.stderr)
        return {}

def handle_test() -> Dict[str, Any]:
    """Testar conectividade e funcionamento"""
    try:
        database = get_database()
        
        # Teste de criação e leitura
        test_key = f"test_{int(__import__('time').time())}"
        test_data = {"test": True, "timestamp": int(__import__('time').time())}
        
        # Criar
        paste_id = database.create(test_key, test_data, {"type": "test"})
        
        # Ler
        record = database.read(test_key)
        
        # Limpar
        database.delete(test_key)
        
        if record and record.data.get("test"):
            return {
                "success": True,
                "service": database.current_service.name,
                "service_url": database.current_service.base_url,
                "test_paste_id": paste_id
            }
        else:
            return {"success": False, "error": "Test failed: Could not verify data"}
            
    except Exception as e:
        return {"success": False, "error": f"Test error: {str(e)}"}

def main():
    """Função principal que processa comandos via linha de comando"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No operation specified"}))
        sys.exit(1)
    
    operation = sys.argv[1].lower()
    result = None
    
    try:
        if operation == "create":
            if len(sys.argv) < 4:
                raise ValueError("Create requires key and data")
            key = sys.argv[2]
            data_json = sys.argv[3]
            metadata_json = sys.argv[4] if len(sys.argv) > 4 else None
            result = handle_create(key, data_json, metadata_json)
            
        elif operation == "read":
            if len(sys.argv) < 3:
                raise ValueError("Read requires key")
            key = sys.argv[2]
            result = handle_read(key)
            
        elif operation == "update":
            if len(sys.argv) < 4:
                raise ValueError("Update requires key and data")
            key = sys.argv[2]
            data_json = sys.argv[3]
            metadata_json = sys.argv[4] if len(sys.argv) > 4 else None
            result = handle_update(key, data_json, metadata_json)
            
        elif operation == "delete":
            if len(sys.argv) < 3:
                raise ValueError("Delete requires key")
            key = sys.argv[2]
            result = handle_delete(key)
            
        elif operation == "list_keys":
            result = handle_list_keys()
            
        elif operation == "search":
            if len(sys.argv) < 3:
                raise ValueError("Search requires query")
            query = sys.argv[2]
            field = sys.argv[3] if len(sys.argv) > 3 else None
            result = handle_search(query, field)
            
        elif operation == "count":
            result = handle_count()
            
        elif operation == "backup":
            filename = sys.argv[2] if len(sys.argv) > 2 else None
            result = handle_backup(filename)
            
        elif operation == "info":
            info = handle_get_info()
            result = {
                "success": True,
                "info": info
            }
            
        elif operation == "test":
            result = handle_test()
            
        else:
            result = {"error": f"Unknown operation: {operation}"}
            
    except Exception as e:
        result = {"error": f"Operation error: {str(e)}"}
    
    # Retornar resultado como JSON
    if result is not None:
        print(json.dumps(result, ensure_ascii=False, indent=None))
    else:
        print("null")

if __name__ == "__main__":
    main()
