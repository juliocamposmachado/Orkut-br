/**
 * 🔒 ORKUT PASSWORD UTILITIES
 * ==========================
 * 
 * Utilitários para hash e verificação segura de senhas
 * usando crypto nativo do navegador para compatibilidade
 */

/**
 * Gera um salt aleatório
 */
export const generateSalt = (): string => {
  if (typeof window !== 'undefined') {
    // Cliente - usar crypto do navegador
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Servidor - usar Node.js crypto
    const crypto = require('crypto');
    return crypto.randomBytes(16).toString('hex');
  }
};

/**
 * Faz hash da senha com salt usando PBKDF2
 */
export const hashPassword = async (password: string, salt?: string): Promise<{ hash: string, salt: string }> => {
  const saltToUse = salt || generateSalt();
  
  if (typeof window !== 'undefined') {
    // Cliente - usar SubtleCrypto
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(saltToUse),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const hashArray = new Uint8Array(hashBuffer);
    const hash = Array.from(hashArray, byte => byte.toString(16).padStart(2, '0')).join('');
    
    return { hash, salt: saltToUse };
  } else {
    // Servidor - usar Node.js crypto
    const crypto = require('crypto');
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(password, saltToUse, 100000, 32, 'sha256', (err: Error, derivedKey: Buffer) => {
        if (err) reject(err);
        else resolve({ hash: derivedKey.toString('hex'), salt: saltToUse });
      });
    });
  }
};

/**
 * Verifica se a senha corresponde ao hash
 */
export const verifyPassword = async (password: string, hash: string, salt: string): Promise<boolean> => {
  try {
    const { hash: newHash } = await hashPassword(password, salt);
    return newHash === hash;
  } catch (error) {
    console.error('Erro na verificação de senha:', error);
    return false;
  }
};

/**
 * Gera ID único para usuário
 */
export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Gera token de sessão
 */
export const generateSessionToken = (): string => {
  if (typeof window !== 'undefined') {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
};
