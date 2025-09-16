import requests
import json
import time
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import hashlib

@dataclass
class DatabaseRecord:
    """Representa um registro no banco de dados"""
    id: str
    data: Dict[str, Any]
    created_at: int
    updated_at: int
    metadata: Dict[str, str] = None

class PasteDatabase:
    """
    Sistema de banco de dados usando a API do Paste
    Permite armazenar, recuperar, atualizar e deletar dados usando o serviço Paste como backend
    """
    
    def __init__(self, base_url: str = "https://paste.safone.me"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'PasteDatabase/1.0'
        })
        
        # Índice local para mapear chaves para IDs do Paste
        self.index = {}
        self.index_id = None
        
    def _make_request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Faz requisição para a API do Paste"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == 'GET':
                response = self.session.get(url)
            elif method == 'POST':
                response = self.session.post(url, json=data)
            else:
                raise ValueError(f"Método HTTP não suportado: {method}")
                
            response.raise_for_status()
            
            # Se a resposta for JSON, retorna como dict
            if response.headers.get('content-type', '').startswith('application/json'):
                return response.json()
            else:
                # Para respostas de texto (como /raw/{id}), retorna como string
                return {'content': response.text}
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Erro na requisição para {url}: {str(e)}")
    
    def _load_index(self):
        """Carrega o índice do banco de dados"""
        if self.index_id:
            try:
                response = self._make_request('GET', f'/api/get/{self.index_id}')
                self.index = json.loads(response['content'])
            except:
                self.index = {}
    
    def _save_index(self):
        """Salva o índice do banco de dados"""
        index_data = {
            'content': json.dumps(self.index, indent=2),
            'filename': 'database_index.json',
            'language': 'json',
            'ephemeral': False
        }
        
        if self.index_id:
            # Atualizar índice existente (deletar e recriar)
            try:
                self._make_request('GET', f'/api/delete/{self.index_id}')
            except:
                pass
        
        response = self._make_request('POST', '/api/new', index_data)
        self.index_id = response['id']
        
    def create(self, key: str, data: Dict[str, Any], metadata: Dict[str, str] = None) -> str:
        """
        Cria um novo registro no banco de dados
        
        Args:
            key: Chave única para identificar o registro
            data: Dados a serem armazenados
            metadata: Metadados opcionais
            
        Returns:
            str: ID do registro criado
        """
        if not self.index:
            self._load_index()
            
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
        
        # Cria o documento no Paste
        document_data = {
            'content': json.dumps(record.__dict__, indent=2),
            'filename': f'{key}.json',
            'language': 'json',
            'ephemeral': False
        }
        
        response = self._make_request('POST', '/api/new', document_data)
        record.id = response['id']
        
        # Atualiza o índice
        self.index[key] = {
            'paste_id': record.id,
            'created_at': record.created_at,
            'updated_at': record.updated_at,
            'metadata': record.metadata
        }
        
        self._save_index()
        
        return record.id
    
    def read(self, key: str) -> Optional[DatabaseRecord]:
        """
        Lê um registro do banco de dados
        
        Args:
            key: Chave do registro
            
        Returns:
            DatabaseRecord: Registro encontrado ou None
        """
        if not self.index:
            self._load_index()
            
        if key not in self.index:
            return None
            
        paste_id = self.index[key]['paste_id']
        
        try:
            response = self._make_request('GET', f'/api/get/{paste_id}')
            record_data = json.loads(response['content'])
            
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
        """
        Atualiza um registro existente
        
        Args:
            key: Chave do registro
            data: Novos dados
            metadata: Novos metadados (opcional)
            
        Returns:
            bool: True se atualizado com sucesso
        """
        if not self.index:
            self._load_index()
            
        if key not in self.index:
            return False
        
        # Lê o registro atual
        current_record = self.read(key)
        if not current_record:
            return False
            
        # Deleta o registro antigo
        old_paste_id = self.index[key]['paste_id']
        try:
            self._make_request('GET', f'/api/delete/{old_paste_id}')
        except:
            pass
        
        # Cria novo registro
        updated_record = DatabaseRecord(
            id="",  # Será preenchido após a criação
            data=data,
            created_at=current_record.created_at,
            updated_at=int(time.time()),
            metadata=metadata or current_record.metadata
        )
        
        # Cria novo documento no Paste
        document_data = {
            'content': json.dumps(updated_record.__dict__, indent=2),
            'filename': f'{key}.json',
            'language': 'json',
            'ephemeral': False
        }
        
        response = self._make_request('POST', '/api/new', document_data)
        updated_record.id = response['id']
        
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
        """
        Deleta um registro do banco de dados
        
        Args:
            key: Chave do registro
            
        Returns:
            bool: True se deletado com sucesso
        """
        if not self.index:
            self._load_index()
            
        if key not in self.index:
            return False
            
        paste_id = self.index[key]['paste_id']
        
        try:
            # Deleta do Paste
            self._make_request('GET', f'/api/delete/{paste_id}')
            
            # Remove do índice
            del self.index[key]
            self._save_index()
            
            return True
        except:
            return False
    
    def list_keys(self) -> List[str]:
        """
        Lista todas as chaves no banco de dados
        
        Returns:
            List[str]: Lista de chaves
        """
        if not self.index:
            self._load_index()
            
        return list(self.index.keys())
    
    def search(self, query: str, field: str = None) -> List[str]:
        """
        Busca registros que contenham o termo especificado
        
        Args:
            query: Termo de busca
            field: Campo específico para buscar (opcional)
            
        Returns:
            List[str]: Lista de chaves dos registros encontrados
        """
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
        """
        Retorna o número de registros no banco de dados
        
        Returns:
            int: Número de registros
        """
        if not self.index:
            self._load_index()
            
        return len(self.index)
    
    def backup(self, filename: str = None) -> str:
        """
        Cria um backup completo do banco de dados
        
        Args:
            filename: Nome do arquivo de backup (opcional)
            
        Returns:
            str: ID do backup no Paste
        """
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
        document_data = {
            'content': json.dumps(backup_data, indent=2),
            'filename': filename,
            'language': 'json',
            'ephemeral': False
        }
        
        response = self._make_request('POST', '/api/new', document_data)
        return response['id']
