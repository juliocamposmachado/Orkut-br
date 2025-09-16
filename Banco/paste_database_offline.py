import json
import time
import os
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import hashlib
import uuid

@dataclass
class DatabaseRecord:
    """Representa um registro no banco de dados"""
    id: str
    data: Dict[str, Any]
    created_at: int
    updated_at: int
    metadata: Dict[str, str] = None

class OfflinePasteDatabase:
    """
    Versão offline/demo do PasteDatabase para demonstração
    Salva os dados localmente em arquivos JSON
    """
    
    def __init__(self, storage_dir: str = "paste_storage"):
        self.storage_dir = storage_dir
        self.index_file = os.path.join(storage_dir, "index.json")
        
        # Criar diretório se não existir
        if not os.path.exists(storage_dir):
            os.makedirs(storage_dir)
            
        # Carregar índice
        self.index = self._load_index()
    
    def _load_index(self) -> dict:
        """Carrega o índice do disco"""
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except:
                return {}
        return {}
    
    def _save_index(self):
        """Salva o índice no disco"""
        with open(self.index_file, 'w', encoding='utf-8') as f:
            json.dump(self.index, f, indent=2, ensure_ascii=False)
    
    def _generate_id(self) -> str:
        """Gera um ID único para simular o ID do Paste"""
        return str(uuid.uuid4())[:8]
    
    def _get_file_path(self, paste_id: str) -> str:
        """Retorna o caminho do arquivo para um ID"""
        return os.path.join(self.storage_dir, f"{paste_id}.json")
    
    def create(self, key: str, data: Dict[str, Any], metadata: Dict[str, str] = None) -> str:
        """Cria um novo registro no banco de dados"""
        # Verifica se a chave já existe
        if key in self.index:
            raise ValueError(f"Chave '{key}' já existe no banco de dados")
        
        # Prepara o registro
        record = DatabaseRecord(
            id="",  # Será preenchido após a criação
            data=data,
            created_at=int(time.time()),
            updated_at=int(time.time()),
            metadata=metadata or {}
        )
        
        # Gera ID único
        paste_id = self._generate_id()
        record.id = paste_id
        
        # Salva o registro
        file_path = self._get_file_path(paste_id)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(record.__dict__, f, indent=2, ensure_ascii=False)
        
        # Atualiza o índice
        self.index[key] = {
            'paste_id': paste_id,
            'created_at': record.created_at,
            'updated_at': record.updated_at,
            'metadata': record.metadata
        }
        
        self._save_index()
        
        print(f"📝 Registro salvo localmente: {file_path}")
        return paste_id
    
    def read(self, key: str) -> Optional[DatabaseRecord]:
        """Lê um registro do banco de dados"""
        if key not in self.index:
            return None
            
        paste_id = self.index[key]['paste_id']
        file_path = self._get_file_path(paste_id)
        
        if not os.path.exists(file_path):
            return None
            
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                record_data = json.load(f)
            
            return DatabaseRecord(
                id=record_data.get('id', ''),
                data=record_data.get('data', {}),
                created_at=record_data.get('created_at', 0),
                updated_at=record_data.get('updated_at', 0),
                metadata=record_data.get('metadata', {})
            )
        except:
            return None
    
    def update(self, key: str, data: Dict[str, Any], metadata: Dict[str, str] = None) -> bool:
        """Atualiza um registro existente"""
        if key not in self.index:
            return False
        
        # Lê o registro atual
        current_record = self.read(key)
        if not current_record:
            return False
        
        # Atualiza o registro
        updated_record = DatabaseRecord(
            id=current_record.id,
            data=data,
            created_at=current_record.created_at,
            updated_at=int(time.time()),
            metadata=metadata or current_record.metadata
        )
        
        # Salva o registro atualizado
        file_path = self._get_file_path(updated_record.id)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(updated_record.__dict__, f, indent=2, ensure_ascii=False)
        
        # Atualiza o índice
        self.index[key] = {
            'paste_id': updated_record.id,
            'created_at': updated_record.created_at,
            'updated_at': updated_record.updated_at,
            'metadata': updated_record.metadata
        }
        
        self._save_index()
        
        return True
    
    def delete(self, key: str) -> bool:
        """Deleta um registro do banco de dados"""
        if key not in self.index:
            return False
            
        paste_id = self.index[key]['paste_id']
        file_path = self._get_file_path(paste_id)
        
        try:
            # Remove o arquivo
            if os.path.exists(file_path):
                os.remove(file_path)
            
            # Remove do índice
            del self.index[key]
            self._save_index()
            
            return True
        except:
            return False
    
    def list_keys(self) -> List[str]:
        """Lista todas as chaves no banco de dados"""
        return list(self.index.keys())
    
    def search(self, query: str, field: str = None) -> List[str]:
        """Busca registros que contenham o termo especificado"""
        results = []
        
        for key in self.list_keys():
            record = self.read(key)
            if record:
                # Busca no campo específico ou em todos os dados
                if field:
                    if field in record.data and query.lower() in str(record.data[field]).lower():
                        results.append(key)
                else:
                    # Busca em todos os campos
                    record_str = json.dumps(record.data).lower()
                    if query.lower() in record_str:
                        results.append(key)
        
        return results
    
    def count(self) -> int:
        """Retorna o número de registros no banco de dados"""
        return len(self.index)
    
    def backup(self, filename: str = None) -> str:
        """Cria um backup completo do banco de dados"""
        if not filename:
            filename = f"database_backup_{int(time.time())}.json"
            
        backup_data = {
            'index': self.index,
            'records': {}
        }
        
        # Coleta todos os registros
        for key in self.list_keys():
            record = self.read(key)
            if record:
                backup_data['records'][key] = record.__dict__
        
        # Salva o backup
        backup_path = os.path.join(self.storage_dir, filename)
        with open(backup_path, 'w', encoding='utf-8') as f:
            json.dump(backup_data, f, indent=2, ensure_ascii=False)
        
        print(f"💾 Backup salvo em: {backup_path}")
        return backup_path
    
    def get_storage_info(self) -> Dict[str, Any]:
        """Retorna informações sobre o armazenamento local"""
        total_files = len([f for f in os.listdir(self.storage_dir) if f.endswith('.json')])
        total_size = sum(
            os.path.getsize(os.path.join(self.storage_dir, f)) 
            for f in os.listdir(self.storage_dir)
        )
        
        return {
            'storage_directory': os.path.abspath(self.storage_dir),
            'total_files': total_files,
            'total_size_bytes': total_size,
            'total_size_mb': round(total_size / (1024 * 1024), 2),
            'index_entries': len(self.index)
        }
