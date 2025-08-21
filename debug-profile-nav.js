// Script de depuração para testar navegação do perfil
// Execute no console do navegador para verificar o estado da navegação

console.log('=== DEBUG: Navegação do Perfil ===');

// Verificar localStorage
const storedUser = localStorage.getItem('orkut_user');
const storedProfile = localStorage.getItem('orkut_profile');

console.log('localStorage orkut_user:', storedUser);
console.log('localStorage orkut_profile:', storedProfile);

if (storedProfile) {
  try {
    const profile = JSON.parse(storedProfile);
    console.log('Profile parsed:', profile);
    console.log('Profile username:', profile.username);
    console.log('Profile display_name:', profile.display_name);
    console.log('Profile ID:', profile.id);
    
    const expectedUrl = profile.username ? `/perfil/${profile.username}` : '/perfil';
    console.log('Expected profile URL:', expectedUrl);
  } catch (e) {
    console.error('Error parsing profile:', e);
  }
}

// Testar o clique do avatar programaticamente
console.log('Procurando avatar do perfil no DOM...');
const avatar = document.querySelector('[title*="Julio"] img, [alt*="Julio"]');
const avatarLink = document.querySelector('a[href*="/perfil"]');

if (avatar) {
  console.log('Avatar encontrado:', avatar);
}

if (avatarLink) {
  console.log('Link do avatar encontrado:', avatarLink);
  console.log('URL do link:', avatarLink.href);
}

// Verificar se há erros de console relacionados à navegação
console.log('=== Fim do Debug ===');
console.log('Para testar: clique no avatar do perfil no canto superior direito');
