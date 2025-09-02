# 🔥 Orkut Trending Topics API

API automatizada para buscar trending topics do Google Trends Brasil, desenvolvida para integração com o projeto Orkut BR.

## 🚀 Funcionalidades

- ✅ **Atualização Automática**: Busca trending topics a cada 30 minutos (configurável)
- ✅ **Cache Inteligente**: Armazena dados em memória para responses rápidas  
- ✅ **Multiple Endpoints**: Diferentes rotas para diferentes necessidades
- ✅ **Dados Ricos**: Inclui notícias relacionadas, imagens e métricas de tráfego
- ✅ **CORS Habilitado**: Pronto para integração frontend
- ✅ **Logs Detalhados**: Monitoramento completo da aplicação
- ✅ **Health Check**: Endpoint para verificar status da API

## 📋 Pré-requisitos

- Node.js >= 14.0.0
- npm ou yarn

## 🔧 Instalação

1. **Clone ou navegue até o diretório**:
```bash
cd D:\Jogos\Orkut\trending-api
```

2. **Instale as dependências**:
```bash
npm install
```

3. **Configure o ambiente** (opcional):
```bash
copy .env.example .env
# Edite o arquivo .env conforme necessário
```

4. **Inicie o servidor**:
```bash
# Produção
npm start

# Desenvolvimento (com nodemon)
npm run dev
```

## 📡 Endpoints da API

### 🔥 GET `/api/trending`
Retorna os trending topics completos com todas as informações.

**Parâmetros de Query:**
- `limit` (opcional): Número máximo de itens (padrão: 20)
- `force` (opcional): `true` para forçar atualização dos dados

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "ana paula arósio",
      "traffic": "2000+",
      "trafficNumber": 2000,
      "publishDate": "Sat, 30 Aug 2025 14:50:00 -0700",
      "picture": "https://encrypted-tbn0.gstatic.com/...",
      "pictureSource": "Gshow",
      "newsItems": [
        {
          "title": "Terra Nostra: Antonio Calloni relembra coincidência...",
          "url": "https://gshow.globo.com/...",
          "source": "Gshow",
          "picture": "https://encrypted-tbn0.gstatic.com/..."
        }
      ]
    }
  ],
  "metadata": {
    "lastUpdated": "2025-08-30T22:45:00.000Z",
    "totalItems": 10,
    "returnedItems": 10,
    "isUpdating": false,
    "nextUpdate": "2025-08-30T23:15:00.000Z"
  }
}
```

### 📝 GET `/api/trending/titles`
Retorna apenas os títulos e tráfego (endpoint mais leve).

**Parâmetros:**
- `limit` (opcional): Número máximo de itens (padrão: 10)

### 📊 GET `/api/status`
Retorna status da API e informações do cache.

### 🔄 POST `/api/trending/refresh`
Força uma atualização imediata dos trending topics.

### ❤️ GET `/health`
Health check da aplicação.

## ⚙️ Configuração

A API pode ser configurada através de variáveis de ambiente:

| Variável | Descrição | Padrão |
|----------|-----------|---------|
| `PORT` | Porta do servidor | 3001 |
| `UPDATE_INTERVAL_MINUTES` | Intervalo de atualização em minutos | 30 |
| `MAX_TRENDS` | Máximo de trends para retornar | 20 |

## 🔗 Integração com seu Frontend

### JavaScript/Fetch
```javascript
// Buscar trending topics
const response = await fetch('http://localhost:3001/api/trending?limit=10');
const data = await response.json();

if (data.success) {
    console.log('Trending topics:', data.data);
}
```

### jQuery
```javascript
$.get('http://localhost:3001/api/trending/titles?limit=5')
    .done(function(data) {
        if (data.success) {
            data.data.forEach(item => {
                console.log(\`\${item.title} - \${item.traffic}\`);
            });
        }
    });
```

### React/Vue/Angular
```javascript
useEffect(() => {
    const fetchTrending = async () => {
        try {
            const response = await fetch('http://localhost:3001/api/trending');
            const data = await response.json();
            setTrendingTopics(data.data);
        } catch (error) {
            console.error('Erro ao buscar trending topics:', error);
        }
    };

    fetchTrending();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchTrending, 5 * 60 * 1000);
    return () => clearInterval(interval);
}, []);
```

## 📊 Monitoramento

A API fornece logs detalhados:

```
[2025-08-30T22:45:00.000Z] 🚀 API de Trending Topics iniciada na porta 3001
[2025-08-30T22:45:00.000Z] 🕒 Agendando atualização automática: a cada 30 minutos
[2025-08-30T22:45:01.000Z] 🔄 Carregando dados iniciais...
[2025-08-30T22:45:02.000Z] Buscando trending topics...
[2025-08-30T22:45:03.000Z] ✅ 10 trending topics atualizados com sucesso
```

## 🛠️ Desenvolvimento

### Scripts disponíveis:
```bash
npm start      # Inicia em produção
npm run dev    # Inicia com nodemon (desenvolvimento)
npm run test   # Testa a API
```

### Estrutura do projeto:
```
trending-api/
├── server.js          # Aplicação principal
├── package.json       # Dependências e scripts
├── .env.example       # Configurações de exemplo
└── README.md          # Este arquivo
```

## 🔧 Troubleshooting

### API não está retornando dados
1. Verifique se o Google Trends está acessível
2. Confira os logs para erros de rede
3. Teste manualmente: `GET /api/status`

### Problemas de CORS
A API já tem CORS habilitado, mas se necessário, modifique as configurações no `server.js`.

### Performance
- A API usa cache em memória para responses rápidas
- Evite fazer muitas requisições simultâneas
- Use o endpoint `/api/trending/titles` para dados mais leves

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para o Orkut BR** 🇧🇷
