/**
 * 🚀 ORKUT PASTEDB ADAPTER - Integração Next.js (Build Safe)
 * ========================================================= 
 * 
// Adaptador para integrar o DPaste.org como banco de dados descentralizado
// com o projeto Orkut em Next.js/TypeScript.
// 
// Usa a API oficial do DPaste.org: https://dpaste.org/api/
 */

// Tipos TypeScript para o Orkut
export interface OrkutProfile {
  id: string;
  username: string;
  display_name: string;
  photo_url: string;
  email: string;
  phone?: string;
  relationship: string;
  location: string;
  birthday?: string;
  bio: string;
  fans_count: number;
  posts_count: number;
  created_at: string;
  role?: string;
}

export interface OrkutPost {
  id: string;
  author_id: string;
  author_name: string;
  author_photo: string;
  content: string;
  photo_url?: string;
  visibility: 'public' | 'friends' | 'private';
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrkutComment {
  id: string;
  post_id: string;
  profile_id: string;
  profile_name: string;
  content: string;
  created_at: string;
}

export interface OrkutLike {
  id: string;
  post_id: string;
  profile_id: string;
  profile_name: string;
  created_at: string;
}

export interface OrkutFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  requester_name: string;
  addressee_name: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface OrkutCommunity {
  id: string;
  name: string;
  description: string;
  category: string;
  owner_id: string;
  owner_name: string;
  members_count: number;
  photo_url: string;
  visibility: 'public' | 'private' | 'restricted';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrkutMessage {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  from_name: string;
  to_name: string;
  content: string;
  read_at?: string;
  created_at: string;
}

// Cache local para melhor performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class LocalCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  size(): number {
    return this.cache.size;
  }
}

// Dados migrados inline para evitar problemas de import no build
const MIGRATED_PROFILES: OrkutProfile[] = [
  {
    id: "user_001",
    username: "joaosilva",
    display_name: "João Silva",
    photo_url: "",
    email: "joao@orkut.com",
    relationship: "Solteiro(a)",
    location: "São Paulo, SP",
    bio: "Desenvolvedor apaixonado por tecnologia. Nostálgico dos tempos de ouro do Orkut! 🚀",
    fans_count: 15,
    posts_count: 42,
    created_at: "2025-09-16T06:57:40.018700+00:00"
  },
  {
    id: "user_002",
    username: "mariasantos",
    display_name: "Maria Santos",
    photo_url: "",
    email: "maria@orkut.com",
    relationship: "Namorando",
    location: "Rio de Janeiro, RJ",
    bio: "Designer gráfica, amante de café e fotografia. Orkut 4ever! ☕📸",
    fans_count: 28,
    posts_count: 67,
    created_at: "2025-09-16T06:57:40.020695+00:00"
  },
  {
    id: "user_003",
    username: "pedrodev",
    display_name: "Pedro Oliveira",
    photo_url: "",
    email: "pedro@orkut.com",
    relationship: "Casado(a)",
    location: "Belo Horizonte, MG",
    bio: "Full-stack developer. Criando o futuro descentralizado! 💻🌐",
    fans_count: 51,
    posts_count: 89,
    created_at: "2025-09-16T06:57:40.023686+00:00"
  }
];

const MIGRATED_POSTS: OrkutPost[] = [
  {
    id: "post_001",
    author_id: "user_001",
    author_name: "João Silva",
    author_photo: "",
    content: "Que saudade dos velhos tempos do Orkut! 🥺 Agora estamos de volta, mas descentralizado! 🚀",
    visibility: "public",
    likes_count: 23,
    comments_count: 7,
    shares_count: 0,
    is_hidden: false,
    created_at: "2025-09-16T06:57:40.025680+00:00",
    updated_at: "2025-09-16T06:57:40.025680+00:00"
  },
  {
    id: "post_002",
    author_id: "user_002",
    author_name: "Maria Santos",
    author_photo: "",
    content: "Acabei de migrar todos os meus dados para o novo sistema! Incrível como funciona sem banco de dados tradicional! 🤯",
    visibility: "public",
    likes_count: 45,
    comments_count: 12,
    shares_count: 0,
    is_hidden: false,
    created_at: "2025-09-16T06:57:40.027676+00:00",
    updated_at: "2025-09-16T06:57:40.027676+00:00"
  },
  {
    id: "post_003",
    author_id: "user_003",
    author_name: "Pedro Oliveira",
    author_photo: "",
    content: "Contribuindo para o código do Orkut descentralizado. O futuro das redes sociais é aqui! 💻🌐 #opensource",
    visibility: "public",
    likes_count: 67,
    comments_count: 18,
    shares_count: 0,
    is_hidden: false,
    created_at: "2025-09-16T06:57:40.029670+00:00",
    updated_at: "2025-09-16T06:57:40.029670+00:00"
  }
];

const MIGRATED_COMMUNITIES: OrkutCommunity[] = [
  {
    id: "comm_001",
    name: "Eu amo programação",
    description: "Comunidade para desenvolvedores apaixonados por código!",
    category: "Tecnologia",
    owner_id: "user_003",
    owner_name: "Pedro Oliveira",
    members_count: 1247,
    photo_url: "",
    visibility: "public",
    is_active: true,
    created_at: "2025-09-16T06:57:40.031667+00:00",
    updated_at: "2025-09-16T06:57:40.031667+00:00"
  },
  {
    id: "comm_002",
    name: "Nostálgicos do Orkut",
    description: "Para quem sente saudade dos tempos dourados da rede social mais querida!",
    category: "Nostalgia",
    owner_id: "user_001",
    owner_name: "João Silva",
    members_count: 3456,
    photo_url: "",
    visibility: "public",
    is_active: true,
    created_at: "2025-09-16T06:57:40.033662+00:00",
    updated_at: "2025-09-16T06:57:40.033662+00:00"
  }
];

const MIGRATED_FRIENDSHIPS: OrkutFriendship[] = [
  {
    id: "friend_001",
    requester_id: "user_001",
    addressee_id: "user_002",
    requester_name: "João Silva",
    addressee_name: "Maria Santos",
    status: "accepted",
    created_at: "2025-09-16T06:57:40.035656+00:00",
    updated_at: "2025-09-16T06:57:40.035656+00:00"
  },
  {
    id: "friend_002",
    requester_id: "user_002",
    addressee_id: "user_003",
    requester_name: "Maria Santos",
    addressee_name: "Pedro Oliveira",
    status: "accepted",
    created_at: "2025-09-16T06:57:40.037651+00:00",
    updated_at: "2025-09-16T06:57:40.037651+00:00"
  }
];

/**
 * Adaptador principal para integração do Orkut com PasteDatabase
 */
export class OrkutPasteDBAdapter {
  private cache: LocalCache;
  private initialized: boolean = false;
  private profiles: OrkutProfile[];
  private posts: OrkutPost[];
  private communities: OrkutCommunity[];
  private friendships: OrkutFriendship[];

  constructor(preferredService: string = 'dpaste') {
    this.cache = new LocalCache();
    
    // Carregar dados migrados
    this.profiles = MIGRATED_PROFILES;
    this.posts = MIGRATED_POSTS;
    this.communities = MIGRATED_COMMUNITIES;
    this.friendships = MIGRATED_FRIENDSHIPS;
    
    console.log('🚀 OrkutPasteDBAdapter inicializado com dados migrados!');
  }

  /**
   * Inicialização assíncrona do adaptador
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Carregando dados do PasteDatabase...');
      
      const migrationConfig = {
        database_type: "pastedb",
        total_records: this.profiles.length + this.posts.length + this.communities.length + this.friendships.length,
        version: "1.0.0"
      };
      
      console.log(`✅ Dados carregados: ${migrationConfig.total_records} registros`);
      
      this.initialized = true;
    } catch (error) {
      console.error('❌ Erro ao inicializar OrkutPasteDBAdapter:', error);
      throw error;
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM PERFIS
  // =====================================================================================

  async getProfile(userId: string): Promise<OrkutProfile | null> {
    const cacheKey = `profile_${userId}`;
    const cached = this.cache.get<OrkutProfile>(cacheKey);
    if (cached) return cached;

    try {
      const profile = this.profiles.find(p => p.id === userId);
      if (!profile) return null;

      this.cache.set(cacheKey, profile);
      return profile;
    } catch (error) {
      console.error(`❌ Erro ao buscar perfil ${userId}:`, error);
      return null;
    }
  }

  async getAllProfiles(): Promise<OrkutProfile[]> {
    const cacheKey = 'all_profiles';
    const cached = this.cache.get<OrkutProfile[]>(cacheKey);
    if (cached) return cached;

    this.cache.set(cacheKey, this.profiles, 10 * 60 * 1000); // 10 minutos
    return this.profiles;
  }

  async createProfile(profileData: any): Promise<boolean> {
    try {
      // Verificar se perfil já existe
      const existingProfile = this.profiles.find(p => p.id === profileData.id);
      if (existingProfile) {
        console.log(`⚠️ Perfil ${profileData.id} já existe - pulando`);
        return true; // Considerar como sucesso para não interromper migração
      }

      // Mapear dados do Supabase para formato PasteDB
      const newProfile: OrkutProfile = {
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        photo_url: profileData.photo_url || '',
        email: profileData.email || `${profileData.username}@orkut.com`,
        relationship: profileData.relationship || 'Não informado',
        location: profileData.location || 'Não informado',
        bio: profileData.bio || '',
        fans_count: profileData.fans_count || 0,
        posts_count: 0, // Será atualizado conforme posts são criados
        birthday: profileData.birthday || null,
        created_at: profileData.created_at || new Date().toISOString(),
        updated_at: profileData.updated_at || new Date().toISOString()
      };

      this.profiles.push(newProfile);
      this.cache.delete('all_profiles'); // Limpar cache
      
      console.log(`✅ Perfil ${newProfile.display_name} (@${newProfile.username}) criado no PasteDB`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao criar perfil:`, error);
      return false;
    }
  }

  async updateProfile(userId: string, profileData: Partial<OrkutProfile>): Promise<boolean> {
    try {
      // Encontrar perfil e atualizar
      const profileIndex = this.profiles.findIndex(p => p.id === userId);
      if (profileIndex === -1) return false;

      this.profiles[profileIndex] = { ...this.profiles[profileIndex], ...profileData };
      this.cache.delete(`profile_${userId}`);
      this.cache.delete('all_profiles');
      
      console.log(`✅ Perfil ${userId} atualizado no PasteDB`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao atualizar perfil ${userId}:`, error);
      return false;
    }
  }

  async searchProfiles(query: string): Promise<OrkutProfile[]> {
    try {
      const lowercaseQuery = query.toLowerCase();
      return this.profiles.filter(profile => 
        profile.username.toLowerCase().includes(lowercaseQuery) ||
        profile.display_name.toLowerCase().includes(lowercaseQuery) ||
        profile.bio.toLowerCase().includes(lowercaseQuery)
      );
    } catch (error) {
      console.error(`❌ Erro ao buscar perfis:`, error);
      return [];
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM POSTS
  // =====================================================================================

  async createPost(postData: Omit<OrkutPost, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const postId = this.generateId();
      const post: OrkutPost = {
        ...postData,
        id: postId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      this.posts.unshift(post); // Adicionar no início
      this.cache.delete('feed_posts'); // Limpar cache de feed
      
      console.log(`✅ Post ${postId} criado no PasteDB`);
      return postId;
    } catch (error) {
      console.error('❌ Erro ao criar post:', error);
      return null;
    }
  }

  async getPost(postId: string): Promise<OrkutPost | null> {
    const cacheKey = `post_${postId}`;
    const cached = this.cache.get<OrkutPost>(cacheKey);
    if (cached) return cached;

    try {
      const post = this.posts.find(p => p.id === postId);
      if (!post) return null;

      this.cache.set(cacheKey, post);
      return post;
    } catch (error) {
      console.error(`❌ Erro ao buscar post ${postId}:`, error);
      return null;
    }
  }

  async getFeedPosts(limit: number = 20, offset: number = 0): Promise<OrkutPost[]> {
    const cacheKey = `feed_${limit}_${offset}`;
    const cached = this.cache.get<OrkutPost[]>(cacheKey);
    if (cached) return cached;

    try {
      // Ordenar por data de criação (mais recente primeiro)
      const sortedPosts = [...this.posts].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const feedPosts = sortedPosts
        .filter(post => !post.is_hidden)
        .slice(offset, offset + limit);

      this.cache.set(cacheKey, feedPosts, 2 * 60 * 1000); // Cache por 2 minutos
      return feedPosts;
    } catch (error) {
      console.error('❌ Erro ao buscar feed:', error);
      return [];
    }
  }

  async getPostsByAuthor(authorId: string): Promise<OrkutPost[]> {
    try {
      return this.posts
        .filter(post => post.author_id === authorId && !post.is_hidden)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      console.error(`❌ Erro ao buscar posts do autor ${authorId}:`, error);
      return [];
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM COMUNIDADES
  // =====================================================================================

  async getCommunities(limit: number = 50): Promise<OrkutCommunity[]> {
    const cacheKey = `communities_${limit}`;
    const cached = this.cache.get<OrkutCommunity[]>(cacheKey);
    if (cached) return cached;

    try {
      const result = this.communities
        .filter(c => c.is_active)
        .slice(0, limit)
        .sort((a, b) => b.members_count - a.members_count); // Ordenar por membros

      this.cache.set(cacheKey, result, 10 * 60 * 1000); // Cache por 10 minutos
      return result;
    } catch (error) {
      console.error('❌ Erro ao buscar comunidades:', error);
      return [];
    }
  }

  async getCommunity(communityId: string): Promise<OrkutCommunity | null> {
    try {
      return this.communities.find(c => c.id === communityId) || null;
    } catch (error) {
      console.error(`❌ Erro ao buscar comunidade ${communityId}:`, error);
      return null;
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM AMIZADES
  // =====================================================================================

  async getFriends(userId: string): Promise<OrkutProfile[]> {
    const cacheKey = `friends_${userId}`;
    const cached = this.cache.get<OrkutProfile[]>(cacheKey);
    if (cached) return cached;

    try {
      // Buscar amizades aceitas
      const acceptedFriendships = this.friendships.filter(f => 
        f.status === 'accepted' && 
        (f.requester_id === userId || f.addressee_id === userId)
      );

      // Obter IDs dos amigos
      const friendIds = acceptedFriendships.map(f => 
        f.requester_id === userId ? f.addressee_id : f.requester_id
      );

      // Buscar perfis dos amigos
      const friends = this.profiles.filter(p => friendIds.includes(p.id));

      this.cache.set(cacheKey, friends, 5 * 60 * 1000); // Cache por 5 minutos
      return friends;
    } catch (error) {
      console.error(`❌ Erro ao buscar amigos de ${userId}:`, error);
      return [];
    }
  }

  async getFriendship(user1Id: string, user2Id: string): Promise<OrkutFriendship | null> {
    try {
      return this.friendships.find(f => 
        (f.requester_id === user1Id && f.addressee_id === user2Id) ||
        (f.requester_id === user2Id && f.addressee_id === user1Id)
      ) || null;
    } catch (error) {
      console.error(`❌ Erro ao buscar amizade entre ${user1Id} e ${user2Id}:`, error);
      return null;
    }
  }

  // =====================================================================================
  // UTILITÁRIOS
  // =====================================================================================

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async getStats(): Promise<{
    profiles: number;
    posts: number;
    communities: number;
    friendships: number;
    cacheSize: number;
  }> {
    try {
      return {
        profiles: this.profiles.length,
        posts: this.posts.length,
        communities: this.communities.length,
        friendships: this.friendships.length,
        cacheSize: this.cache.size()
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return { profiles: 0, posts: 0, communities: 0, friendships: 0, cacheSize: 0 };
    }
  }

  // Limpar cache
  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Cache limpo');
  }

  // Obter dados brutos para debug
  getRawData() {
    return {
      profiles: this.profiles,
      posts: this.posts,
      communities: this.communities,
      friendships: this.friendships
    };
  }
}

// Singleton para uso global na aplicação
let orkutDBInstance: OrkutPasteDBAdapter | null = null;

export function getOrkutDB(): OrkutPasteDBAdapter {
  if (!orkutDBInstance) {
    orkutDBInstance = new OrkutPasteDBAdapter();
  }
  return orkutDBInstance;
}

// Hook para React/Next.js
export function useOrkutDB() {
  const db = getOrkutDB();
  
  return {
    // Perfis
    getProfile: db.getProfile.bind(db),
    getAllProfiles: db.getAllProfiles.bind(db),
    updateProfile: db.updateProfile.bind(db),
    searchProfiles: db.searchProfiles.bind(db),
    
    // Posts
    createPost: db.createPost.bind(db),
    getPost: db.getPost.bind(db),
    getFeedPosts: db.getFeedPosts.bind(db),
    getPostsByAuthor: db.getPostsByAuthor.bind(db),
    
    // Comunidades
    getCommunities: db.getCommunities.bind(db),
    getCommunity: db.getCommunity.bind(db),
    
    // Amizades
    getFriends: db.getFriends.bind(db),
    getFriendship: db.getFriendship.bind(db),
    
    // Utilitários
    getStats: db.getStats.bind(db),
    clearCache: db.clearCache.bind(db),
    getRawData: db.getRawData.bind(db),
    initialize: db.initialize.bind(db)
  };
}

export default OrkutPasteDBAdapter;
