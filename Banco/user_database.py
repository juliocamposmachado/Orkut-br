#!/usr/bin/env python3
"""
👥 ORKUT USER DATABASE - Sistema de Usuários no PasteDB
======================================================

Sistema especializado para gerenciar usuários usando o
banco de dados descentralizado PasteDB (dpaste.org)
"""

import json
import time
from typing import Dict, List, Optional, Any
from multi_paste_database import MultiPasteDatabase, DatabaseRecord
from dataclasses import dataclass
import hashlib
import secrets

@dataclass
class UserRecord:
    """Representa um usuário no sistema"""
    id: str
    username: str
    email: str
    password_hash: str
    password_salt: str
    display_name: str
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    birthday: Optional[str] = None
    relationship: Optional[str] = None
    role: str = 'user'  # user, moderator, admin
    fans_count: int = 0
    email_confirmed: bool = False
    email_confirmed_at: Optional[str] = None
    created_at: int = 0
    updated_at: int = 0
    last_login_at: Optional[int] = None

@dataclass 
class SessionRecord:
    """Representa uma sessão de usuário"""
    token: str
    user_id: str
    username: str
    created_at: int
    expires_at: int
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None

class UserDatabase(MultiPasteDatabase):
    """
    Sistema de usuários baseado no PasteDB
    """
    
    def __init__(self, preferred_service: str = "dpaste"):
        super().__init__(preferred_service)
        
        # Índices especializados para usuários
        self.users_by_email = {}
        self.users_by_username = {}
        self.active_sessions = {}
        
        # Carregar índices
        self._load_user_indices()
    
    def _load_user_indices(self):
        """Carrega índices especializados de usuários"""
        try:
            # Índice de emails
            email_index = self.read("__email_index__")
            if email_index:
                self.users_by_email = email_index.data
            
            # Índice de usernames
            username_index = self.read("__username_index__")
            if username_index:
                self.users_by_username = username_index.data
                
            # Índice de sessões ativas
            sessions_index = self.read("__sessions_index__")
            if sessions_index:
                self.active_sessions = sessions_index.data
                # Limpar sessões expiradas
                self._clean_expired_sessions()
                
        except Exception as e:
            print(f"Aviso: Erro ao carregar índices: {e}")
    
    def _save_user_indices(self):
        """Salva índices especializados"""
        try:
            # Salvar índice de emails
            self.create("__email_index__", self.users_by_email, {"type": "email_index"})
        except:
            self.update("__email_index__", self.users_by_email)
            
        try:
            # Salvar índice de usernames
            self.create("__username_index__", self.users_by_username, {"type": "username_index"})
        except:
            self.update("__username_index__", self.users_by_username)
            
        try:
            # Salvar índice de sessões
            self.create("__sessions_index__", self.active_sessions, {"type": "sessions_index"})
        except:
            self.update("__sessions_index__", self.active_sessions)
    
    def _hash_password(self, password: str, salt: str = None) -> tuple:
        """Faz hash seguro da senha"""
        if not salt:
            salt = secrets.token_hex(16)
        
        # Usar PBKDF2 com 100.000 iterações
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        
        return password_hash, salt
    
    def _verify_password(self, password: str, password_hash: str, salt: str) -> bool:
        """Verifica se a senha está correta"""
        try:
            test_hash, _ = self._hash_password(password, salt)
            return test_hash == password_hash
        except:
            return False
    
    def _generate_session_token(self) -> str:
        """Gera token de sessão único"""
        return secrets.token_urlsafe(32)
    
    def _clean_expired_sessions(self):
        """Remove sessões expiradas"""
        current_time = int(time.time())
        expired_tokens = []
        
        for token, session_data in self.active_sessions.items():
            if session_data.get('expires_at', 0) < current_time:
                expired_tokens.append(token)
        
        for token in expired_tokens:
            del self.active_sessions[token]
    
    def create_user(self, email: str, password: str, username: str, display_name: str) -> str:
        """
        Cria um novo usuário no sistema
        
        Args:
            email: Email do usuário (único)
            password: Senha em texto plano
            username: Username único
            display_name: Nome de exibição
            
        Returns:
            str: ID do usuário criado
            
        Raises:
            ValueError: Se email ou username já existir
        """
        # Verificar se email já existe
        if email.lower() in self.users_by_email:
            raise ValueError(f"Email '{email}' já está em uso")
        
        # Verificar se username já existe
        if username.lower() in self.users_by_username:
            raise ValueError(f"Username '{username}' já está em uso")
        
        # Gerar ID único
        user_id = f"user_{int(time.time())}_{secrets.token_hex(8)}"
        
        # Hash da senha
        password_hash, password_salt = self._hash_password(password)
        
        # Criar registro do usuário
        user_record = UserRecord(
            id=user_id,
            username=username,
            email=email,
            password_hash=password_hash,
            password_salt=password_salt,
            display_name=display_name,
            created_at=int(time.time()),
            updated_at=int(time.time())
        )
        
        # Salvar no banco
        user_key = f"user:{user_id}"
        self.create(user_key, user_record.__dict__, {"type": "user", "username": username, "email": email})
        
        # Atualizar índices
        self.users_by_email[email.lower()] = {"user_id": user_id, "username": username}
        self.users_by_username[username.lower()] = {"user_id": user_id, "email": email}
        self._save_user_indices()
        
        print(f"✅ Usuário criado: {username} ({email}) - ID: {user_id}")
        return user_id
    
    def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Autentica usuário com email e senha
        
        Args:
            email: Email do usuário
            password: Senha em texto plano
            
        Returns:
            Dict com dados do usuário se autenticado, None caso contrário
        """
        # Buscar usuário por email
        email_lower = email.lower()
        if email_lower not in self.users_by_email:
            return None
        
        user_info = self.users_by_email[email_lower]
        user_id = user_info['user_id']
        
        # Carregar dados completos do usuário
        user_record = self.read(f"user:{user_id}")
        if not user_record:
            return None
        
        user_data = user_record.data
        
        # Verificar senha
        if not self._verify_password(password, user_data['password_hash'], user_data['password_salt']):
            return None
        
        # Atualizar último login
        user_data['last_login_at'] = int(time.time())
        user_data['updated_at'] = int(time.time())
        self.update(f"user:{user_id}", user_data)
        
        # Remover dados sensíveis antes de retornar
        safe_user_data = {k: v for k, v in user_data.items() 
                         if k not in ['password_hash', 'password_salt']}
        
        print(f"✅ Usuário autenticado: {user_data['username']}")
        return safe_user_data
    
    def create_session(self, user_id: str, ip_address: str = None, user_agent: str = None) -> str:
        """
        Cria uma nova sessão para o usuário
        
        Args:
            user_id: ID do usuário
            ip_address: IP do cliente (opcional)
            user_agent: User agent do cliente (opcional)
            
        Returns:
            str: Token da sessão
        """
        # Limpar sessões expiradas primeiro
        self._clean_expired_sessions()
        
        # Gerar token único
        session_token = self._generate_session_token()
        
        # Buscar dados do usuário
        user_record = self.read(f"user:{user_id}")
        if not user_record:
            raise ValueError("Usuário não encontrado")
        
        # Criar sessão (expires em 30 dias)
        expires_at = int(time.time()) + (30 * 24 * 60 * 60)
        
        session_data = {
            'token': session_token,
            'user_id': user_id,
            'username': user_record.data['username'],
            'created_at': int(time.time()),
            'expires_at': expires_at,
            'ip_address': ip_address,
            'user_agent': user_agent
        }
        
        # Salvar sessão
        self.active_sessions[session_token] = session_data
        self._save_user_indices()
        
        print(f"✅ Sessão criada para usuário {user_record.data['username']}: {session_token[:16]}...")
        return session_token
    
    def validate_session(self, session_token: str) -> Optional[Dict[str, Any]]:
        """
        Valida um token de sessão
        
        Args:
            session_token: Token da sessão
            
        Returns:
            Dict com dados do usuário se sessão válida, None caso contrário
        """
        # Limpar sessões expiradas
        self._clean_expired_sessions()
        
        if session_token not in self.active_sessions:
            return None
        
        session_data = self.active_sessions[session_token]
        
        # Verificar se não expirou
        if session_data.get('expires_at', 0) < int(time.time()):
            del self.active_sessions[session_token]
            self._save_user_indices()
            return None
        
        # Carregar dados do usuário
        user_record = self.read(f"user:{session_data['user_id']}")
        if not user_record:
            # Sessão órfã, remover
            del self.active_sessions[session_token]
            self._save_user_indices()
            return None
        
        # Remover dados sensíveis
        safe_user_data = {k: v for k, v in user_record.data.items() 
                         if k not in ['password_hash', 'password_salt']}
        
        return safe_user_data
    
    def invalidate_session(self, session_token: str) -> bool:
        """Remove uma sessão (logout)"""
        if session_token in self.active_sessions:
            username = self.active_sessions[session_token].get('username', 'unknown')
            del self.active_sessions[session_token]
            self._save_user_indices()
            print(f"✅ Sessão invalidada para usuário {username}")
            return True
        return False
    
    def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """
        Busca usuário por username
        
        Args:
            username: Username do usuário
            
        Returns:
            Dict com dados do usuário (sem senha) ou None
        """
        username_lower = username.lower()
        if username_lower not in self.users_by_username:
            return None
        
        user_info = self.users_by_username[username_lower]
        user_id = user_info['user_id']
        
        user_record = self.read(f"user:{user_id}")
        if not user_record:
            return None
        
        # Remover dados sensíveis
        safe_user_data = {k: v for k, v in user_record.data.items() 
                         if k not in ['password_hash', 'password_salt']}
        
        return safe_user_data
    
    def update_user(self, user_id: str, updates: Dict[str, Any]) -> bool:
        """
        Atualiza dados de um usuário
        
        Args:
            user_id: ID do usuário
            updates: Campos para atualizar
            
        Returns:
            bool: True se atualizado com sucesso
        """
        user_record = self.read(f"user:{user_id}")
        if not user_record:
            return False
        
        user_data = user_record.data
        
        # Aplicar atualizações (excluindo campos protegidos)
        protected_fields = ['id', 'password_hash', 'password_salt', 'created_at']
        for key, value in updates.items():
            if key not in protected_fields:
                user_data[key] = value
        
        user_data['updated_at'] = int(time.time())
        
        # Salvar
        return self.update(f"user:{user_id}", user_data)
    
    def list_users(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Lista usuários do sistema (dados públicos apenas)
        
        Args:
            limit: Máximo de usuários a retornar
            
        Returns:
            List com dados públicos dos usuários
        """
        users = []
        count = 0
        
        for username_lower, user_info in self.users_by_username.items():
            if count >= limit:
                break
                
            user_id = user_info['user_id']
            user_record = self.read(f"user:{user_id}")
            
            if user_record:
                # Dados públicos apenas
                public_data = {
                    'id': user_record.data.get('id'),
                    'username': user_record.data.get('username'),
                    'display_name': user_record.data.get('display_name'),
                    'photo_url': user_record.data.get('photo_url'),
                    'bio': user_record.data.get('bio'),
                    'location': user_record.data.get('location'),
                    'fans_count': user_record.data.get('fans_count', 0),
                    'created_at': user_record.data.get('created_at')
                }
                users.append(public_data)
                count += 1
        
        return users
    
    def get_database_stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas do banco de usuários
        
        Returns:
            Dict com estatísticas
        """
        # Limpar sessões expiradas primeiro
        self._clean_expired_sessions()
        
        return {
            'total_users': len(self.users_by_username),
            'total_emails': len(self.users_by_email),
            'active_sessions': len(self.active_sessions),
            'service': self.current_service.name,
            'service_url': self.current_service.base_url,
            'index_paste_id': self.index_paste_id
        }
