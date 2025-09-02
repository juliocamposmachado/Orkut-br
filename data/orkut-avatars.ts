// Coleção de avatars temáticos do Orkut
// Usando emojis e símbolos nostálgicos para manter a compatibilidade

export interface OrkutAvatar {
  id: string
  name: string
  emoji: string
  category: 'pessoas' | 'animais' | 'objetos' | 'nostalgia' | 'profissoes' | 'hobbies'
  description: string
}

export const orkutAvatars: OrkutAvatar[] = [
  // Pessoas e Expressões (estilo anos 2000)
  { id: 'cool-guy', name: 'Cara Legal', emoji: '😎', category: 'pessoas', description: 'O cara mais descolado do Orkut' },
  { id: 'happy-girl', name: 'Menina Feliz', emoji: '😊', category: 'pessoas', description: 'Sempre sorrindo e positiva' },
  { id: 'rocker', name: 'Roqueiro', emoji: '🤘', category: 'pessoas', description: 'Rock n roll forever!' },
  { id: 'nerd', name: 'Nerdão', emoji: '🤓', category: 'pessoas', description: 'Inteligente e tecnológico' },
  { id: 'diva', name: 'Diva', emoji: '💅', category: 'pessoas', description: 'Glamourosa e estilosa' },
  { id: 'angel', name: 'Anjinho', emoji: '😇', category: 'pessoas', description: 'Pura e inocente' },
  { id: 'devil', name: 'Diabinho', emoji: '😈', category: 'pessoas', description: 'Um pouquinho rebelde' },
  { id: 'party-guy', name: 'Festeiro', emoji: '🥳', category: 'pessoas', description: 'Sempre pronto para a festa' },

  // Animais Fofos (mascotes do Orkut)
  { id: 'cat', name: 'Gatinho', emoji: '🐱', category: 'animais', description: 'Fofinho e brincalhão' },
  { id: 'dog', name: 'Cachorrinho', emoji: '🐶', category: 'animais', description: 'Melhor amigo de todos' },
  { id: 'panda', name: 'Panda', emoji: '🐼', category: 'animais', description: 'Fofo e preguiçoso' },
  { id: 'monkey', name: 'Macaquinho', emoji: '🐵', category: 'animais', description: 'Divertido e travesso' },
  { id: 'pig', name: 'Porquinho', emoji: '🐷', category: 'animais', description: 'Rosa e adorável' },
  { id: 'bear', name: 'Ursinho', emoji: '🐻', category: 'animais', description: 'Carinhoso e protetor' },
  { id: 'tiger', name: 'Tigrinho', emoji: '🐯', category: 'animais', description: 'Selvagem mas fofo' },
  { id: 'lion', name: 'Leãozinho', emoji: '🦁', category: 'animais', description: 'Rei da selva' },

  // Objetos Nostálgicos (anos 2000)
  { id: 'computer', name: 'PC Retrô', emoji: '💻', category: 'nostalgia', description: 'Navegando no Orkut' },
  { id: 'cd', name: 'CD de Música', emoji: '💿', category: 'nostalgia', description: 'Playlist dos anos 2000' },
  { id: 'camera', name: 'Câmera Digital', emoji: '📷', category: 'nostalgia', description: 'Fotolog vibes' },
  { id: 'phone', name: 'Celular Flip', emoji: '📱', category: 'nostalgia', description: 'SMS e toque midi' },
  { id: 'heart', name: 'Coração', emoji: '💝', category: 'nostalgia', description: 'Love is in the air' },
  { id: 'star', name: 'Estrela', emoji: '⭐', category: 'nostalgia', description: 'Você é especial' },
  { id: 'rainbow', name: 'Arco-íris', emoji: '🌈', category: 'nostalgia', description: 'Colorido e feliz' },
  { id: 'music', name: 'Nota Musical', emoji: '🎵', category: 'nostalgia', description: 'Música é vida' },

  // Profissões e Hobbies
  { id: 'artist', name: 'Artista', emoji: '🎨', category: 'profissoes', description: 'Criativo e talentoso' },
  { id: 'musician', name: 'Músico', emoji: '🎸', category: 'profissoes', description: 'Som na caixa!' },
  { id: 'gamer', name: 'Gamer', emoji: '🎮', category: 'hobbies', description: 'Level up sempre' },
  { id: 'reader', name: 'Leitor', emoji: '📚', category: 'hobbies', description: 'Conhecimento é poder' },
  { id: 'traveler', name: 'Viajante', emoji: '✈️', category: 'hobbies', description: 'Explorando o mundo' },
  { id: 'chef', name: 'Chef', emoji: '👨‍🍳', category: 'profissoes', description: 'Cozinheiro de mão cheia' },
  { id: 'athlete', name: 'Atleta', emoji: '⚽', category: 'hobbies', description: 'Esporte é saúde' },
  { id: 'dancer', name: 'Dançarino', emoji: '💃', category: 'hobbies', description: 'Ritmo no sangue' },

  // Objetos Divertidos
  { id: 'pizza', name: 'Pizza', emoji: '🍕', category: 'objetos', description: 'Comida favorita de todos' },
  { id: 'coffee', name: 'Café', emoji: '☕', category: 'objetos', description: 'Energia para o dia' },
  { id: 'cake', name: 'Bolo', emoji: '🎂', category: 'objetos', description: 'Celebrando a vida' },
  { id: 'sunglasses', name: 'Óculos Escuros', emoji: '🕶️', category: 'objetos', description: 'Style total' },
  { id: 'crown', name: 'Coroa', emoji: '👑', category: 'objetos', description: 'Você é o rei/rainha' },
  { id: 'gem', name: 'Diamante', emoji: '💎', category: 'objetos', description: 'Precioso e raro' },
  { id: 'fire', name: 'Fogo', emoji: '🔥', category: 'objetos', description: 'Postagem quente!' },
  { id: 'thunderbolt', name: 'Raio', emoji: '⚡', category: 'objetos', description: 'Energia pura' }
]

// Função para buscar avatar por categoria
export const getAvatarsByCategory = (category: OrkutAvatar['category']): OrkutAvatar[] => {
  return orkutAvatars.filter(avatar => avatar.category === category)
}

// Função para buscar avatar por ID
export const getAvatarById = (id: string): OrkutAvatar | undefined => {
  return orkutAvatars.find(avatar => avatar.id === id)
}

// Função para obter um avatar aleatório
export const getRandomAvatar = (): OrkutAvatar => {
  const randomIndex = Math.floor(Math.random() * orkutAvatars.length)
  return orkutAvatars[randomIndex]
}

// Categorias disponíveis
export const avatarCategories = [
  { key: 'pessoas' as const, name: 'Pessoas', icon: '👥' },
  { key: 'animais' as const, name: 'Animais', icon: '🐾' },
  { key: 'nostalgia' as const, name: 'Nostalgia', icon: '💫' },
  { key: 'profissoes' as const, name: 'Profissões', icon: '💼' },
  { key: 'hobbies' as const, name: 'Hobbies', icon: '🎯' },
  { key: 'objetos' as const, name: 'Objetos', icon: '🎁' }
]
