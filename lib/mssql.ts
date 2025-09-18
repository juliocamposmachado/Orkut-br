/**
 * 🚀 ORKUT MS SQL SERVER CONFIGURATION
 * =====================================
 * 
 * Configuração para conectar com MS SQL Server 2022 Express
 * Baseado nas informações fornecidas:
 * - Servidor: OrkutBr.mssql.somee.com
 * - Usuário: juliomachado_SQLLogin_1
 * - Versão: MS SQL Server 2022 Express
 */

import sql from 'mssql';

// Configuração baseada na string de conexão fornecida
// workstation id=OrkutBr.mssql.somee.com;packet size=4096;user id=juliomachado_SQLLogin_1;pwd=5f2ir4l9sa;data source=OrkutBr.mssql.somee.com;persist security info=False;initial catalog=OrkutBr;TrustServerCertificate=True
const config: sql.config = {
  server: process.env.MSSQL_SERVER || 'OrkutBr.mssql.somee.com',
  database: process.env.MSSQL_DATABASE || 'OrkutBr',
  user: process.env.MSSQL_USER || 'juliomachado_SQLLogin_1',
  password: process.env.MSSQL_PASSWORD || '5f2ir4l9sa',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // Para Azure/Somee.com
    trustServerCertificate: true, // Aceitar certificados auto-assinados (Somee.com)
    enableArithAbort: true,
    packetSize: 4096 // Baseado na connection string
  },
  connectionTimeout: 30000,
  requestTimeout: 30000,
  port: 1433 // Porta padrão do SQL Server
};

// Pool de conexões
let pool: sql.ConnectionPool | null = null;

/**
 * Obter pool de conexão
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Conectado ao MS SQL Server:', config.server);
  }
  return pool;
}

/**
 * Executar query
 */
export async function executeQuery(query: string, params?: { [key: string]: any }): Promise<sql.IResult<any>> {
  const poolConnection = await getPool();
  const request = poolConnection.request();
  
  // Adicionar parâmetros se fornecidos
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }
  
  return await request.query(query);
}

/**
 * Executar stored procedure
 */
export async function executeStoredProcedure(procedureName: string, params?: { [key: string]: any }): Promise<sql.IResult<any>> {
  const poolConnection = await getPool();
  const request = poolConnection.request();
  
  // Adicionar parâmetros se fornecidos
  if (params) {
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
  }
  
  return await request.execute(procedureName);
}

/**
 * Fechar conexão
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 Conexão MS SQL Server fechada');
  }
}

/**
 * Testar conexão
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1 as test');
    console.log('✅ Teste de conexão MS SQL Server bem-sucedido');
    return result.recordset.length > 0;
  } catch (error) {
    console.error('❌ Erro no teste de conexão MS SQL Server:', error);
    return false;
  }
}

// Configurações de tabelas para migração
export const TABLE_DEFINITIONS = {
  profiles: `
    CREATE TABLE profiles (
      id NVARCHAR(50) PRIMARY KEY,
      username NVARCHAR(100) UNIQUE NOT NULL,
      display_name NVARCHAR(200) NOT NULL,
      photo_url NVARCHAR(MAX),
      email NVARCHAR(200),
      phone NVARCHAR(50),
      relationship NVARCHAR(50),
      location NVARCHAR(200),
      birthday DATE,
      bio NVARCHAR(MAX),
      fans_count INT DEFAULT 0,
      posts_count INT DEFAULT 0,
      role NVARCHAR(50),
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE()
    )
  `,
  posts: `
    CREATE TABLE posts (
      id NVARCHAR(50) PRIMARY KEY,
      author_id NVARCHAR(50) NOT NULL,
      author_name NVARCHAR(200) NOT NULL,
      author_photo NVARCHAR(MAX),
      content NVARCHAR(MAX) NOT NULL,
      photo_url NVARCHAR(MAX),
      visibility NVARCHAR(20) DEFAULT 'public',
      likes_count INT DEFAULT 0,
      comments_count INT DEFAULT 0,
      shares_count INT DEFAULT 0,
      is_hidden BIT DEFAULT 0,
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (author_id) REFERENCES profiles(id)
    )
  `,
  communities: `
    CREATE TABLE communities (
      id NVARCHAR(50) PRIMARY KEY,
      name NVARCHAR(200) NOT NULL,
      description NVARCHAR(MAX),
      category NVARCHAR(100),
      owner_id NVARCHAR(50) NOT NULL,
      owner_name NVARCHAR(200) NOT NULL,
      members_count INT DEFAULT 0,
      photo_url NVARCHAR(MAX),
      visibility NVARCHAR(20) DEFAULT 'public',
      is_active BIT DEFAULT 1,
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (owner_id) REFERENCES profiles(id)
    )
  `,
  friendships: `
    CREATE TABLE friendships (
      id NVARCHAR(50) PRIMARY KEY,
      requester_id NVARCHAR(50) NOT NULL,
      addressee_id NVARCHAR(50) NOT NULL,
      requester_name NVARCHAR(200) NOT NULL,
      addressee_name NVARCHAR(200) NOT NULL,
      status NVARCHAR(20) DEFAULT 'pending',
      created_at DATETIME2 DEFAULT GETDATE(),
      updated_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (requester_id) REFERENCES profiles(id),
      FOREIGN KEY (addressee_id) REFERENCES profiles(id),
      UNIQUE (requester_id, addressee_id)
    )
  `,
  comments: `
    CREATE TABLE comments (
      id NVARCHAR(50) PRIMARY KEY,
      post_id NVARCHAR(50) NOT NULL,
      profile_id NVARCHAR(50) NOT NULL,
      profile_name NVARCHAR(200) NOT NULL,
      content NVARCHAR(MAX) NOT NULL,
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id)
    )
  `,
  likes: `
    CREATE TABLE likes (
      id NVARCHAR(50) PRIMARY KEY,
      post_id NVARCHAR(50) NOT NULL,
      profile_id NVARCHAR(50) NOT NULL,
      profile_name NVARCHAR(200) NOT NULL,
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id),
      UNIQUE (post_id, profile_id)
    )
  `,
  messages: `
    CREATE TABLE messages (
      id NVARCHAR(50) PRIMARY KEY,
      from_profile_id NVARCHAR(50) NOT NULL,
      to_profile_id NVARCHAR(50) NOT NULL,
      from_name NVARCHAR(200) NOT NULL,
      to_name NVARCHAR(200) NOT NULL,
      content NVARCHAR(MAX) NOT NULL,
      read_at DATETIME2,
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (from_profile_id) REFERENCES profiles(id),
      FOREIGN KEY (to_profile_id) REFERENCES profiles(id)
    )
  `
};

export default { getPool, executeQuery, executeStoredProcedure, closeConnection, testConnection };
