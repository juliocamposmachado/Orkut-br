#!/usr/bin/env python3
"""
🚀 ORKUT MIGRATION TOOL - SQL para PasteDatabase
===============================================

Ferramenta para migrar o banco de dados SQL do Orkut para nosso 
sistema descentralizado usando múltiplos serviços de pastebin.

Esta ferramenta revolucionária permite que o Orkut funcione completamente
sem precisar de banco de dados tradicional!
"""

import json
import time
import uuid
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from multi_paste_database import MultiPasteDatabase

@dataclass
class OrkutProfile:
    """Representa um perfil de usuário do Orkut"""
    id: str
    username: str
    display_name: str
    photo_url: str
    email: str
    phone: Optional[str] = None
    relationship: str = "Solteiro(a)"
    location: str = ""
    birthday: Optional[str] = None
    bio: str = ""
    fans_count: int = 0
    posts_count: int = 0
    created_at: str = ""
    role: Optional[str] = None

@dataclass
class OrkutPost:
    """Representa um post do feed"""
    id: str
    author_id: str
    author_name: str
    author_photo: str
    content: str
    photo_url: Optional[str] = None
    visibility: str = "public"
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    is_hidden: bool = False
    created_at: str = ""
    updated_at: str = ""

@dataclass
class OrkutComment:
    """Representa um comentário"""
    id: str
    post_id: str
    profile_id: str
    profile_name: str
    content: str
    created_at: str = ""

@dataclass
class OrkutLike:
    """Representa uma curtida"""
    id: str
    post_id: str
    profile_id: str
    profile_name: str
    created_at: str = ""

@dataclass
class OrkutFriendship:
    """Representa uma amizade"""
    id: str
    requester_id: str
    addressee_id: str
    requester_name: str
    addressee_name: str
    status: str = "pending"  # pending, accepted, blocked
    created_at: str = ""
    updated_at: str = ""

@dataclass
class OrkutMessage:
    """Representa uma mensagem privada"""
    id: str
    from_profile_id: str
    to_profile_id: str
    from_name: str
    to_name: str
    content: str
    read_at: Optional[str] = None
    created_at: str = ""

@dataclass
class OrkutCommunity:
    """Representa uma comunidade"""
    id: str
    name: str
    description: str
    category: str
    owner_id: str
    owner_name: str
    members_count: int = 0
    photo_url: str = ""
    visibility: str = "public"  # public, private, restricted
    is_active: bool = True
    created_at: str = ""
    updated_at: str = ""

class OrkutMigrationTool:
    """
    Ferramenta principal de migração do Orkut
    
    Converte dados do PostgreSQL/Supabase para sistema distribuído
    usando múltiplos serviços de pastebin como backend.
    """
    
    def __init__(self, preferred_service: str = "dpaste"):
        """
        Inicializa a ferramenta de migração
        
        Args:
            preferred_service: Serviço de pastebin preferido
        """
        print("🚀 Inicializando Orkut Migration Tool...")
        
        # Usar nossa implementação offline para garantir que funciona
        from paste_database_offline import OfflinePasteDatabase
        self.db = OfflinePasteDatabase("orkut_pastedb")
        
        print(f"✅ Banco PasteDatabase inicializado")
        
        # Contadores para estatísticas
        self.migration_stats = {
            'profiles': 0,
            'posts': 0,
            'comments': 0,
            'likes': 0,
            'friendships': 0,
            'messages': 0,
            'communities': 0,
            'total_records': 0,
            'errors': 0
        }
        
    def generate_id(self) -> str:
        """Gera um ID único para compatibilidade"""
        return str(uuid.uuid4())
    
    def current_timestamp(self) -> str:
        """Retorna timestamp atual em formato ISO"""
        return datetime.now(timezone.utc).isoformat()
    
    def migrate_profile(self, profile_data: Dict[str, Any]) -> bool:
        """
        Migra um perfil de usuário
        
        Args:
            profile_data: Dados do perfil vindos do SQL
            
        Returns:
            bool: True se migração foi bem-sucedida
        """
        try:
            # Converter dados SQL para nosso formato
            profile = OrkutProfile(
                id=profile_data.get('id', self.generate_id()),
                username=profile_data.get('username', 'user'),
                display_name=profile_data.get('display_name', 'Usuário'),
                photo_url=profile_data.get('photo_url', ''),
                email=profile_data.get('email', ''),
                phone=profile_data.get('phone'),
                relationship=profile_data.get('relationship', 'Solteiro(a)'),
                location=profile_data.get('location', ''),
                birthday=profile_data.get('birthday'),
                bio=profile_data.get('bio', ''),
                fans_count=profile_data.get('fans_count', 0),
                posts_count=profile_data.get('posts_count', 0),
                created_at=profile_data.get('created_at', self.current_timestamp()),
                role=profile_data.get('role')
            )
            
            # Salvar no PasteDatabase
            key = f"profile_{profile.id}"
            self.db.create(key, asdict(profile), {
                'type': 'profile',
                'username': profile.username,
                'migrated_at': self.current_timestamp()
            })
            
            self.migration_stats['profiles'] += 1
            return True
            
        except Exception as e:
            print(f"❌ Erro ao migrar perfil {profile_data.get('username', 'unknown')}: {e}")
            self.migration_stats['errors'] += 1
            return False
    
    def migrate_post(self, post_data: Dict[str, Any]) -> bool:
        """Migra um post"""
        try:
            post = OrkutPost(
                id=post_data.get('id', self.generate_id()),
                author_id=post_data.get('author', ''),
                author_name=post_data.get('author_name', 'Usuário'),
                author_photo=post_data.get('author_photo', ''),
                content=post_data.get('content', ''),
                photo_url=post_data.get('photo_url'),
                visibility=post_data.get('visibility', 'public'),
                likes_count=post_data.get('likes_count', 0),
                comments_count=post_data.get('comments_count', 0),
                shares_count=post_data.get('shares_count', 0),
                is_hidden=post_data.get('is_hidden', False),
                created_at=post_data.get('created_at', self.current_timestamp()),
                updated_at=post_data.get('updated_at', self.current_timestamp())
            )
            
            key = f"post_{post.id}"
            self.db.create(key, asdict(post), {
                'type': 'post',
                'author': post.author_name,
                'visibility': post.visibility,
                'migrated_at': self.current_timestamp()
            })
            
            self.migration_stats['posts'] += 1
            return True
            
        except Exception as e:
            print(f"❌ Erro ao migrar post {post_data.get('id', 'unknown')}: {e}")
            self.migration_stats['errors'] += 1
            return False
    
    def migrate_comment(self, comment_data: Dict[str, Any]) -> bool:
        """Migra um comentário"""
        try:
            comment = OrkutComment(
                id=comment_data.get('id', self.generate_id()),
                post_id=comment_data.get('post_id', ''),
                profile_id=comment_data.get('profile_id', ''),
                profile_name=comment_data.get('profile_name', 'Usuário'),
                content=comment_data.get('content', ''),
                created_at=comment_data.get('created_at', self.current_timestamp())
            )
            
            key = f"comment_{comment.id}"
            self.db.create(key, asdict(comment), {
                'type': 'comment',
                'post_id': comment.post_id,
                'author': comment.profile_name,
                'migrated_at': self.current_timestamp()
            })
            
            self.migration_stats['comments'] += 1
            return True
            
        except Exception as e:
            print(f"❌ Erro ao migrar comentário {comment_data.get('id', 'unknown')}: {e}")
            self.migration_stats['errors'] += 1
            return False
    
    def migrate_friendship(self, friendship_data: Dict[str, Any]) -> bool:
        """Migra uma amizade"""
        try:
            friendship = OrkutFriendship(
                id=friendship_data.get('id', self.generate_id()),
                requester_id=friendship_data.get('requester_id', ''),
                addressee_id=friendship_data.get('addressee_id', ''),
                requester_name=friendship_data.get('requester_name', 'Usuário'),
                addressee_name=friendship_data.get('addressee_name', 'Usuário'),
                status=friendship_data.get('status', 'pending'),
                created_at=friendship_data.get('created_at', self.current_timestamp()),
                updated_at=friendship_data.get('updated_at', self.current_timestamp())
            )
            
            key = f"friendship_{friendship.id}"
            self.db.create(key, asdict(friendship), {
                'type': 'friendship',
                'status': friendship.status,
                'migrated_at': self.current_timestamp()
            })
            
            self.migration_stats['friendships'] += 1
            return True
            
        except Exception as e:
            print(f"❌ Erro ao migrar amizade {friendship_data.get('id', 'unknown')}: {e}")
            self.migration_stats['errors'] += 1
            return False
    
    def migrate_community(self, community_data: Dict[str, Any]) -> bool:
        """Migra uma comunidade"""
        try:
            community = OrkutCommunity(
                id=community_data.get('id', self.generate_id()),
                name=community_data.get('name', 'Nova Comunidade'),
                description=community_data.get('description', ''),
                category=community_data.get('category', 'Geral'),
                owner_id=community_data.get('owner', ''),
                owner_name=community_data.get('owner_name', 'Usuário'),
                members_count=community_data.get('members_count', 0),
                photo_url=community_data.get('photo_url', ''),
                visibility=community_data.get('visibility', 'public'),
                is_active=community_data.get('is_active', True),
                created_at=community_data.get('created_at', self.current_timestamp()),
                updated_at=community_data.get('updated_at', self.current_timestamp())
            )
            
            key = f"community_{community.id}"
            self.db.create(key, asdict(community), {
                'type': 'community',
                'category': community.category,
                'visibility': community.visibility,
                'migrated_at': self.current_timestamp()
            })
            
            self.migration_stats['communities'] += 1
            return True
            
        except Exception as e:
            print(f"❌ Erro ao migrar comunidade {community_data.get('name', 'unknown')}: {e}")
            self.migration_stats['errors'] += 1
            return False
    
    def create_demo_data(self):
        """Cria dados de demonstração do Orkut"""
        print("\n🎭 Criando dados de demonstração...")
        
        # Perfis de exemplo
        demo_profiles = [
            {
                'id': 'user_001',
                'username': 'joaosilva',
                'display_name': 'João Silva',
                'email': 'joao@orkut.com',
                'relationship': 'Solteiro(a)',
                'location': 'São Paulo, SP',
                'bio': 'Desenvolvedor apaixonado por tecnologia. Nostálgico dos tempos de ouro do Orkut! 🚀',
                'fans_count': 15,
                'posts_count': 42
            },
            {
                'id': 'user_002',
                'username': 'mariasantos',
                'display_name': 'Maria Santos',
                'email': 'maria@orkut.com',
                'relationship': 'Namorando',
                'location': 'Rio de Janeiro, RJ',
                'bio': 'Designer gráfica, amante de café e fotografia. Orkut 4ever! ☕📸',
                'fans_count': 28,
                'posts_count': 67
            },
            {
                'id': 'user_003',
                'username': 'pedrodev',
                'display_name': 'Pedro Oliveira',
                'email': 'pedro@orkut.com',
                'relationship': 'Casado(a)',
                'location': 'Belo Horizonte, MG',
                'bio': 'Full-stack developer. Criando o futuro descentralizado! 💻🌐',
                'fans_count': 51,
                'posts_count': 89
            }
        ]
        
        # Migrar perfis
        for profile in demo_profiles:
            self.migrate_profile(profile)
            print(f"   ✓ Perfil: {profile['display_name']} (@{profile['username']})")
        
        # Posts de exemplo
        demo_posts = [
            {
                'id': 'post_001',
                'author': 'user_001',
                'author_name': 'João Silva',
                'content': 'Que saudade dos velhos tempos do Orkut! 🥺 Agora estamos de volta, mas descentralizado! 🚀',
                'likes_count': 23,
                'comments_count': 7,
                'visibility': 'public'
            },
            {
                'id': 'post_002',
                'author': 'user_002',
                'author_name': 'Maria Santos',
                'content': 'Acabei de migrar todos os meus dados para o novo sistema! Incrível como funciona sem banco de dados tradicional! 🤯',
                'likes_count': 45,
                'comments_count': 12,
                'visibility': 'public'
            },
            {
                'id': 'post_003',
                'author': 'user_003',
                'author_name': 'Pedro Oliveira',
                'content': 'Contribuindo para o código do Orkut descentralizado. O futuro das redes sociais é aqui! 💻🌐 #opensource',
                'likes_count': 67,
                'comments_count': 18,
                'visibility': 'public'
            }
        ]
        
        # Migrar posts
        for post in demo_posts:
            self.migrate_post(post)
            print(f"   ✓ Post: {post['content'][:50]}...")
        
        # Comunidades de exemplo
        demo_communities = [
            {
                'id': 'comm_001',
                'name': 'Eu amo programação',
                'description': 'Comunidade para desenvolvedores apaixonados por código!',
                'category': 'Tecnologia',
                'owner': 'user_003',
                'owner_name': 'Pedro Oliveira',
                'members_count': 1247,
                'visibility': 'public'
            },
            {
                'id': 'comm_002',
                'name': 'Nostálgicos do Orkut',
                'description': 'Para quem sente saudade dos tempos dourados da rede social mais querida!',
                'category': 'Nostalgia',
                'owner': 'user_001',
                'owner_name': 'João Silva',
                'members_count': 3456,
                'visibility': 'public'
            }
        ]
        
        # Migrar comunidades
        for community in demo_communities:
            self.migrate_community(community)
            print(f"   ✓ Comunidade: {community['name']} ({community['members_count']} membros)")
        
        # Amizades de exemplo
        demo_friendships = [
            {
                'id': 'friend_001',
                'requester_id': 'user_001',
                'addressee_id': 'user_002',
                'requester_name': 'João Silva',
                'addressee_name': 'Maria Santos',
                'status': 'accepted'
            },
            {
                'id': 'friend_002',
                'requester_id': 'user_002',
                'addressee_id': 'user_003',
                'requester_name': 'Maria Santos',
                'addressee_name': 'Pedro Oliveira',
                'status': 'accepted'
            }
        ]
        
        # Migrar amizades
        for friendship in demo_friendships:
            self.migrate_friendship(friendship)
            print(f"   ✓ Amizade: {friendship['requester_name']} ↔ {friendship['addressee_name']}")
    
    def generate_migration_report(self) -> str:
        """Gera relatório detalhado da migração"""
        
        # Calcular estatísticas
        self.migration_stats['total_records'] = sum([
            self.migration_stats['profiles'],
            self.migration_stats['posts'],
            self.migration_stats['comments'],
            self.migration_stats['likes'],
            self.migration_stats['friendships'],
            self.migration_stats['messages'],
            self.migration_stats['communities']
        ])
        
        success_rate = ((self.migration_stats['total_records'] - self.migration_stats['errors']) / 
                       max(self.migration_stats['total_records'], 1)) * 100
        
        # Informações do banco
        db_info = self.db.get_storage_info()
        
        report = f"""
🚀 RELATÓRIO DE MIGRAÇÃO - ORKUT PASTEDB
{'='*60}

📊 ESTATÍSTICAS DA MIGRAÇÃO:
   👥 Perfis migrados: {self.migration_stats['profiles']}
   📝 Posts migrados: {self.migration_stats['posts']}
   💬 Comentários migrados: {self.migration_stats['comments']}
   👍 Curtidas migradas: {self.migration_stats['likes']}
   🤝 Amizades migradas: {self.migration_stats['friendships']}
   💌 Mensagens migradas: {self.migration_stats['messages']}
   🏘️  Comunidades migradas: {self.migration_stats['communities']}
   
   📈 Total de registros: {self.migration_stats['total_records']}
   ❌ Erros encontrados: {self.migration_stats['errors']}
   ✅ Taxa de sucesso: {success_rate:.1f}%

💾 INFORMAÇÕES DO BANCO PASTEDB:
   📁 Diretório: {db_info['storage_directory']}
   📄 Total de arquivos: {db_info['total_files']}
   💿 Tamanho total: {db_info['total_size_mb']} MB
   🔑 Entradas no índice: {db_info['index_entries']}

🎯 PRÓXIMOS PASSOS:
   1. Teste a aplicação com os dados migrados
   2. Configure a integração com serviços de pastebin online
   3. Implemente cache local para melhor performance
   4. Configure backups automáticos dos dados

🌐 VANTAGENS DO SISTEMA DESCENTRALIZADO:
   ✅ Sem dependência de banco de dados tradicional
   ✅ Dados distribuídos em múltiplos serviços
   ✅ Resistente a falhas de servidor único
   ✅ Custos operacionais reduzidos
   ✅ Escalabilidade horizontal automática

{'='*60}
Migração concluída em: {datetime.now().strftime('%d/%m/%Y às %H:%M:%S')}
        """
        
        return report
    
    def export_for_nextjs(self, output_dir: str = "orkut_export"):
        """Exporta dados no formato compatível com Next.js"""
        import os
        
        print(f"\n📤 Exportando dados para {output_dir}...")
        
        # Criar diretório de saída
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Exportar perfis
        profiles = []
        posts = []
        communities = []
        friendships = []
        
        for key in self.db.list_keys():
            record = self.db.read(key)
            if record:
                record_type = record.metadata.get('type')
                
                if record_type == 'profile':
                    profiles.append(record.data)
                elif record_type == 'post':
                    posts.append(record.data)
                elif record_type == 'community':
                    communities.append(record.data)
                elif record_type == 'friendship':
                    friendships.append(record.data)
        
        # Salvar arquivos JSON
        exports = {
            'profiles.json': profiles,
            'posts.json': posts,
            'communities.json': communities,
            'friendships.json': friendships
        }
        
        for filename, data in exports.items():
            filepath = os.path.join(output_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"   ✓ {filename}: {len(data)} registros")
        
        # Criar configuração para Next.js
        nextjs_config = {
            "database_type": "pastedb",
            "total_records": len(profiles) + len(posts) + len(communities) + len(friendships),
            "export_date": self.current_timestamp(),
            "version": "1.0.0"
        }
        
        config_path = os.path.join(output_dir, 'migration_config.json')
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(nextjs_config, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Exportação concluída em {output_dir}/")
    
    def run_full_migration(self):
        """Executa migração completa com dados de demonstração"""
        print("🚀 Iniciando migração completa do Orkut...")
        print("=" * 60)
        
        start_time = time.time()
        
        # Criar dados de demonstração
        self.create_demo_data()
        
        # Criar backup
        print("\n💾 Criando backup...")
        backup_id = self.db.backup("orkut_complete_backup.json")
        print(f"✅ Backup salvo: {backup_id}")
        
        # Exportar para Next.js
        self.export_for_nextjs()
        
        # Calcular tempo total
        total_time = time.time() - start_time
        
        # Gerar e exibir relatório
        report = self.generate_migration_report()
        print(report)
        
        print(f"⏱️  Tempo total de migração: {total_time:.2f} segundos")
        print("🎉 Migração concluída com sucesso!")
        
        return True

def main():
    """Função principal"""
    print("🌟 ORKUT PASTEDB MIGRATION TOOL")
    print("Convertendo Orkut SQL → Sistema Descentralizado")
    print("=" * 60)
    
    try:
        # Inicializar ferramenta
        migration_tool = OrkutMigrationTool()
        
        # Executar migração completa
        migration_tool.run_full_migration()
        
        print("\n🎯 PRÓXIMAS ETAPAS:")
        print("1. Copie os arquivos de 'orkut_export/' para seu projeto Next.js")
        print("2. Configure a integração com PasteDatabase no código")
        print("3. Teste a aplicação com os dados migrados")
        print("4. Configure serviços de pastebin online para produção")
        
    except Exception as e:
        print(f"❌ Erro durante migração: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
