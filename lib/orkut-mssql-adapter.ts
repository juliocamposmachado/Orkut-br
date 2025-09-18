/**
 * 🚀 ORKUT MS SQL SERVER ADAPTER
 * ===============================
 * 
 * Adaptador para integrar o sistema Orkut com MS SQL Server 2022 Express
 * Mantém compatibilidade com a interface existente do PasteDB
 */

import { executeQuery } from './mssql';
import type { 
  OrkutProfile, 
  OrkutPost, 
  OrkutCommunity, 
  OrkutFriendship, 
  OrkutComment, 
  OrkutLike, 
  OrkutMessage 
} from './orkut-pastedb-adapter';

/**
 * Adaptador principal para MS SQL Server
 */
export class OrkutMSSQLAdapter {
  private initialized: boolean = false;

  constructor() {
    console.log('🔗 OrkutMSSQLAdapter inicializado para MS SQL Server 2022 Express');
  }

  /**
   * Inicialização assíncrona
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🔄 Inicializando conexão MS SQL Server...');
      
      // Testar conexão
      const result = await executeQuery('SELECT 1 as test');
      if (result.recordset.length > 0) {
        console.log('✅ Conexão MS SQL Server estabelecida com sucesso');
        this.initialized = true;
      } else {
        throw new Error('Falha no teste de conexão');
      }
    } catch (error) {
      console.error('❌ Erro ao inicializar MS SQL Server:', error);
      throw error;
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM PERFIS
  // =====================================================================================

  async getProfile(userId: string): Promise<OrkutProfile | null> {
    try {
      const result = await executeQuery(
        'SELECT * FROM profiles WHERE id = @userId',
        { userId }
      );

      if (result.recordset.length === 0) return null;

      const row = result.recordset[0];
      return this.mapProfileFromDB(row);
    } catch (error) {
      console.error(`❌ Erro ao buscar perfil ${userId}:`, error);
      return null;
    }
  }

  async getAllProfiles(): Promise<OrkutProfile[]> {
    try {
      const result = await executeQuery(
        'SELECT * FROM profiles ORDER BY created_at DESC'
      );

      return result.recordset.map(row => this.mapProfileFromDB(row));
    } catch (error) {
      console.error('❌ Erro ao buscar todos os perfis:', error);
      return [];
    }
  }

  async createProfile(profileData: Omit<OrkutProfile, 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      await executeQuery(`
        INSERT INTO profiles (
          id, username, display_name, photo_url, email, phone, 
          relationship, location, birthday, bio, fans_count, posts_count, role
        ) VALUES (
          @id, @username, @display_name, @photo_url, @email, @phone,
          @relationship, @location, @birthday, @bio, @fans_count, @posts_count, @role
        )
      `, {
        id: profileData.id,
        username: profileData.username,
        display_name: profileData.display_name,
        photo_url: profileData.photo_url || null,
        email: profileData.email || null,
        phone: profileData.phone || null,
        relationship: profileData.relationship || 'Não informado',
        location: profileData.location || 'Não informado',
        birthday: profileData.birthday || null,
        bio: profileData.bio || '',
        fans_count: profileData.fans_count || 0,
        posts_count: profileData.posts_count || 0,
        role: profileData.role || null
      });

      console.log(`✅ Perfil criado: ${profileData.display_name} (@${profileData.username})`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar perfil:', error);
      return false;
    }
  }

  async updateProfile(userId: string, profileData: Partial<OrkutProfile>): Promise<boolean> {
    try {
      const updateFields: string[] = [];
      const params: { [key: string]: any } = { userId };

      Object.entries(profileData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && value !== undefined) {
          updateFields.push(`${key} = @${key}`);
          params[key] = value;
        }
      });

      if (updateFields.length === 0) return true;

      updateFields.push('updated_at = GETDATE()');

      await executeQuery(`
        UPDATE profiles 
        SET ${updateFields.join(', ')} 
        WHERE id = @userId
      `, params);

      console.log(`✅ Perfil ${userId} atualizado`);
      return true;
    } catch (error) {
      console.error(`❌ Erro ao atualizar perfil ${userId}:`, error);
      return false;
    }
  }

  async searchProfiles(query: string): Promise<OrkutProfile[]> {
    try {
      const result = await executeQuery(`
        SELECT * FROM profiles 
        WHERE username LIKE @query 
           OR display_name LIKE @query 
           OR bio LIKE @query
        ORDER BY display_name
      `, { query: `%${query}%` });

      return result.recordset.map(row => this.mapProfileFromDB(row));
    } catch (error) {
      console.error('❌ Erro ao buscar perfis:', error);
      return [];
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM POSTS
  // =====================================================================================

  async createPost(postData: Omit<OrkutPost, 'id' | 'created_at' | 'updated_at'>): Promise<string | null> {
    try {
      const postId = this.generateId();

      await executeQuery(`
        INSERT INTO posts (
          id, author_id, author_name, author_photo, content, photo_url,
          visibility, likes_count, comments_count, shares_count, is_hidden
        ) VALUES (
          @id, @author_id, @author_name, @author_photo, @content, @photo_url,
          @visibility, @likes_count, @comments_count, @shares_count, @is_hidden
        )
      `, {
        id: postId,
        author_id: postData.author_id,
        author_name: postData.author_name,
        author_photo: postData.author_photo || null,
        content: postData.content,
        photo_url: postData.photo_url || null,
        visibility: postData.visibility || 'public',
        likes_count: postData.likes_count || 0,
        comments_count: postData.comments_count || 0,
        shares_count: postData.shares_count || 0,
        is_hidden: postData.is_hidden || false
      });

      console.log(`✅ Post criado: ${postId}`);
      return postId;
    } catch (error) {
      console.error('❌ Erro ao criar post:', error);
      return null;
    }
  }

  async getPost(postId: string): Promise<OrkutPost | null> {
    try {
      const result = await executeQuery(
        'SELECT * FROM posts WHERE id = @postId',
        { postId }
      );

      if (result.recordset.length === 0) return null;

      return this.mapPostFromDB(result.recordset[0]);
    } catch (error) {
      console.error(`❌ Erro ao buscar post ${postId}:`, error);
      return null;
    }
  }

  async getFeedPosts(limit: number = 20, offset: number = 0): Promise<OrkutPost[]> {
    try {
      const result = await executeQuery(`
        SELECT * FROM posts 
        WHERE is_hidden = 0 AND visibility = 'public'
        ORDER BY created_at DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `, { limit, offset });

      return result.recordset.map(row => this.mapPostFromDB(row));
    } catch (error) {
      console.error('❌ Erro ao buscar feed:', error);
      return [];
    }
  }

  async getPostsByAuthor(authorId: string): Promise<OrkutPost[]> {
    try {
      const result = await executeQuery(`
        SELECT * FROM posts 
        WHERE author_id = @authorId AND is_hidden = 0
        ORDER BY created_at DESC
      `, { authorId });

      return result.recordset.map(row => this.mapPostFromDB(row));
    } catch (error) {
      console.error(`❌ Erro ao buscar posts do autor ${authorId}:`, error);
      return [];
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM COMUNIDADES
  // =====================================================================================

  async getCommunities(limit: number = 50): Promise<OrkutCommunity[]> {
    try {
      const result = await executeQuery(`
        SELECT TOP(@limit) * FROM communities 
        WHERE is_active = 1
        ORDER BY members_count DESC
      `, { limit });

      return result.recordset.map(row => this.mapCommunityFromDB(row));
    } catch (error) {
      console.error('❌ Erro ao buscar comunidades:', error);
      return [];
    }
  }

  async getCommunity(communityId: string): Promise<OrkutCommunity | null> {
    try {
      const result = await executeQuery(
        'SELECT * FROM communities WHERE id = @communityId',
        { communityId }
      );

      if (result.recordset.length === 0) return null;

      return this.mapCommunityFromDB(result.recordset[0]);
    } catch (error) {
      console.error(`❌ Erro ao buscar comunidade ${communityId}:`, error);
      return null;
    }
  }

  // =====================================================================================
  // OPERAÇÕES COM AMIZADES
  // =====================================================================================

  async getFriends(userId: string): Promise<OrkutProfile[]> {
    try {
      const result = await executeQuery(`
        SELECT p.* FROM profiles p
        INNER JOIN friendships f ON (
          (f.requester_id = @userId AND f.addressee_id = p.id) OR
          (f.addressee_id = @userId AND f.requester_id = p.id)
        )
        WHERE f.status = 'accepted'
        ORDER BY p.display_name
      `, { userId });

      return result.recordset.map(row => this.mapProfileFromDB(row));
    } catch (error) {
      console.error(`❌ Erro ao buscar amigos de ${userId}:`, error);
      return [];
    }
  }

  async getFriendship(user1Id: string, user2Id: string): Promise<OrkutFriendship | null> {
    try {
      const result = await executeQuery(`
        SELECT * FROM friendships 
        WHERE (requester_id = @user1Id AND addressee_id = @user2Id) 
           OR (requester_id = @user2Id AND addressee_id = @user1Id)
      `, { user1Id, user2Id });

      if (result.recordset.length === 0) return null;

      return this.mapFriendshipFromDB(result.recordset[0]);
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

  private mapProfileFromDB(row: any): OrkutProfile {
    return {
      id: row.id,
      username: row.username,
      display_name: row.display_name,
      photo_url: row.photo_url || '',
      email: row.email || '',
      phone: row.phone,
      relationship: row.relationship || 'Não informado',
      location: row.location || 'Não informado',
      birthday: row.birthday,
      bio: row.bio || '',
      fans_count: row.fans_count || 0,
      posts_count: row.posts_count || 0,
      created_at: row.created_at.toISOString(),
      role: row.role
    };
  }

  private mapPostFromDB(row: any): OrkutPost {
    return {
      id: row.id,
      author_id: row.author_id,
      author_name: row.author_name,
      author_photo: row.author_photo || '',
      content: row.content,
      photo_url: row.photo_url,
      visibility: row.visibility || 'public',
      likes_count: row.likes_count || 0,
      comments_count: row.comments_count || 0,
      shares_count: row.shares_count || 0,
      is_hidden: Boolean(row.is_hidden),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString()
    };
  }

  private mapCommunityFromDB(row: any): OrkutCommunity {
    return {
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category || '',
      owner_id: row.owner_id,
      owner_name: row.owner_name,
      members_count: row.members_count || 0,
      photo_url: row.photo_url || '',
      visibility: row.visibility || 'public',
      is_active: Boolean(row.is_active),
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString()
    };
  }

  private mapFriendshipFromDB(row: any): OrkutFriendship {
    return {
      id: row.id,
      requester_id: row.requester_id,
      addressee_id: row.addressee_id,
      requester_name: row.requester_name,
      addressee_name: row.addressee_name,
      status: row.status,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString()
    };
  }

  async getStats(): Promise<{
    profiles: number;
    posts: number;
    communities: number;
    friendships: number;
  }> {
    try {
      const [profilesResult, postsResult, communitiesResult, friendshipsResult] = await Promise.all([
        executeQuery('SELECT COUNT(*) as count FROM profiles'),
        executeQuery('SELECT COUNT(*) as count FROM posts'),
        executeQuery('SELECT COUNT(*) as count FROM communities'),
        executeQuery('SELECT COUNT(*) as count FROM friendships')
      ]);

      return {
        profiles: profilesResult.recordset[0].count,
        posts: postsResult.recordset[0].count,
        communities: communitiesResult.recordset[0].count,
        friendships: friendshipsResult.recordset[0].count
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return { profiles: 0, posts: 0, communities: 0, friendships: 0 };
    }
  }
}

// Singleton para uso global
let mssqlInstance: OrkutMSSQLAdapter | null = null;

export function getOrkutMSSQL(): OrkutMSSQLAdapter {
  if (!mssqlInstance) {
    mssqlInstance = new OrkutMSSQLAdapter();
  }
  return mssqlInstance;
}

export default OrkutMSSQLAdapter;
