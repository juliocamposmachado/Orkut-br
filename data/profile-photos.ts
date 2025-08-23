// Sistema de fotos organizadas por perfil de usuário
// Cada usuário tem fotos temáticas baseadas em seu perfil/interesse

export interface ProfilePhoto {
  id: string;
  url: string;
  title: string;
  description?: string;
  category?: string;
}

export interface UserPhotoCollection {
  username: string;
  displayName: string;
  profilePhoto?: string;
  photos: ProfilePhoto[];
}

// Coleções de fotos específicas por usuário
export const profilePhotosData: UserPhotoCollection[] = [
  {
    username: 'juliocamposmachado',
    displayName: 'Julio Cesar Campos Machado',
    profilePhoto: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    photos: [
      {
        id: 'julio-1',
        url: 'https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Coding Setup',
        description: 'Meu setup de desenvolvimento',
        category: 'tecnologia'
      },
      {
        id: 'julio-2', 
        url: 'https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Coffee & Code',
        description: 'Café da manhã de programador',
        category: 'lifestyle'
      },
      {
        id: 'julio-3',
        url: 'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'New MacBook',
        description: 'Minha nova máquina de trabalho',
        category: 'tecnologia'
      },
      {
        id: 'julio-4',
        url: 'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Team Meeting',
        description: 'Reunião com a equipe',
        category: 'trabalho'
      },
      {
        id: 'julio-5',
        url: 'https://images.pexels.com/photos/1029757/pexels-photo-1029757.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Late Night Coding',
        description: 'Programando até tarde',
        category: 'tecnologia'
      },
      {
        id: 'julio-6',
        url: 'https://images.pexels.com/photos/1181298/pexels-photo-1181298.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Code Review',
        description: 'Revisando código com o time',
        category: 'trabalho'
      }
    ]
  },
  {
    username: 'radiotatuapefm',
    displayName: 'Radio Tatuape FM',
    profilePhoto: 'https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg?auto=compress&cs=tinysrgb&w=150',
    photos: [
      {
        id: 'radio-1',
        url: 'https://images.pexels.com/photos/164829/pexels-photo-164829.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Estúdio da Rádio',
        description: 'Nosso estúdio principal',
        category: 'radio'
      },
      {
        id: 'radio-2',
        url: 'https://images.pexels.com/photos/159613/ghettoblaster-radio-recorder-boombox-159613.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Radio Vintage',
        description: 'Equipamentos clássicos',
        category: 'vintage'
      },
      {
        id: 'radio-3',
        url: 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Mesa de Som',
        description: 'Console profissional',
        category: 'equipamento'
      },
      {
        id: 'radio-4',
        url: 'https://images.pexels.com/photos/1540406/pexels-photo-1540406.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Microfone',
        description: 'Microfone do DJ',
        category: 'equipamento'
      },
      {
        id: 'radio-5',
        url: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Vinyl Collection',
        description: 'Nossa coleção de vinis',
        category: 'musica'
      },
      {
        id: 'radio-6',
        url: 'https://images.pexels.com/photos/1813947/pexels-photo-1813947.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Live Session',
        description: 'Transmissão ao vivo',
        category: 'live'
      }
    ]
  },
  {
    username: 'djorky',
    displayName: 'DJ Orky',
    profilePhoto: 'https://images.pexels.com/photos/1493225/pexels-photo-1493225.jpeg?auto=compress&cs=tinysrgb&w=150',
    photos: [
      {
        id: 'dj-1',
        url: 'https://images.pexels.com/photos/1493225/pexels-photo-1493225.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'DJ Setup',
        description: 'Minha mesa de DJ',
        category: 'dj'
      },
      {
        id: 'dj-2',
        url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Headphones',
        description: 'Fones profissionais',
        category: 'equipamento'
      },
      {
        id: 'dj-3',
        url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Party Night',
        description: 'Noite na balada',
        category: 'festa'
      },
      {
        id: 'dj-4',
        url: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Concert',
        description: 'Show ao vivo',
        category: 'show'
      },
      {
        id: 'dj-5',
        url: 'https://images.pexels.com/photos/1540258/pexels-photo-1540258.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Studio Mix',
        description: 'Mixando no estúdio',
        category: 'studio'
      },
      {
        id: 'dj-6',
        url: 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Vinyl Spin',
        description: 'Tocando vinil',
        category: 'vintage'
      }
    ]
  },
  {
    username: 'mariasilva',
    displayName: 'Maria Silva',
    profilePhoto: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    photos: [
      {
        id: 'maria-1',
        url: 'https://images.pexels.com/photos/1181519/pexels-photo-1181519.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Café da Manhã',
        description: 'Começando o dia bem',
        category: 'lifestyle'
      },
      {
        id: 'maria-2',
        url: 'https://images.pexels.com/photos/1181424/pexels-photo-1181424.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Leitura',
        description: 'Meu momento de leitura',
        category: 'hobby'
      },
      {
        id: 'maria-3',
        url: 'https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Jardim',
        description: 'Cuidando das plantas',
        category: 'jardinagem'
      },
      {
        id: 'maria-4',
        url: 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Culinária',
        description: 'Preparando o almoço',
        category: 'culinaria'
      },
      {
        id: 'maria-5',
        url: 'https://images.pexels.com/photos/1181346/pexels-photo-1181346.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Yoga',
        description: 'Momento zen',
        category: 'wellness'
      },
      {
        id: 'maria-6',
        url: 'https://images.pexels.com/photos/1181304/pexels-photo-1181304.jpeg?auto=compress&cs=tinysrgb&w=300',
        title: 'Family Time',
        description: 'Tempo em família',
        category: 'familia'
      }
    ]
  }
];

// Função para buscar fotos de um usuário específico
export const getUserPhotos = (username: string): UserPhotoCollection | null => {
  return profilePhotosData.find(user => user.username === username) || null;
};

// Função para buscar todas as fotos recentes (mix de todos os usuários)
export const getRecentPhotos = (limit: number = 12): ProfilePhoto[] => {
  const allPhotos: ProfilePhoto[] = [];
  
  profilePhotosData.forEach(user => {
    // Pega as primeiras 2 fotos de cada usuário
    allPhotos.push(...user.photos.slice(0, 2));
  });
  
  return allPhotos.slice(0, limit);
};

// Função para buscar fotos por categoria
export const getPhotosByCategory = (category: string): ProfilePhoto[] => {
  const photos: ProfilePhoto[] = [];
  
  profilePhotosData.forEach(user => {
    const categoryPhotos = user.photos.filter(photo => photo.category === category);
    photos.push(...categoryPhotos);
  });
  
  return photos;
};

// Fotos padrão para usuários sem fotos definidas
export const getDefaultPhotos = (): ProfilePhoto[] => {
  return [
    {
      id: 'default-1',
      url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
      title: 'Paisagem',
      category: 'paisagem'
    },
    {
      id: 'default-2', 
      url: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg?auto=compress&cs=tinysrgb&w=300',
      title: 'Natureza',
      category: 'natureza'
    },
    {
      id: 'default-3',
      url: 'https://images.pexels.com/photos/531880/pexels-photo-531880.jpeg?auto=compress&cs=tinysrgb&w=300',
      title: 'Cidade',
      category: 'urbano'
    },
    {
      id: 'default-4',
      url: 'https://images.pexels.com/photos/248797/pexels-photo-248797.jpeg?auto=compress&cs=tinysrgb&w=300',
      title: 'Arte',
      category: 'arte'
    },
    {
      id: 'default-5',
      url: 'https://images.pexels.com/photos/326055/pexels-photo-326055.jpeg?auto=compress&cs=tinysrgb&w=300',
      title: 'Comida',
      category: 'culinaria'
    },
    {
      id: 'default-6',
      url: 'https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg?auto=compress&cs=tinysrgb&w=300',
      title: 'Viagem',
      category: 'viagem'
    }
  ];
};
