/*
  # Insert demo data for testing

  1. Demo Communities
    - Popular communities with different categories
    
  2. Test Users Data
    - Will be inserted after authentication setup
    
  3. Sample Posts and Content
    - Demo content for immediate testing
*/

-- Insert demo communities
INSERT INTO communities (name, description, category, photo_url) VALUES
('Nostalgia dos Anos 2000', 'Relembre os bons tempos dos anos 2000! Músicas, filmes, jogos e muito mais.', 'Nostalgia', 'https://images.pexels.com/photos/1319236/pexels-photo-1319236.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Música', 'Comunidade para compartilhar e descobrir novas músicas de todos os gêneros.', 'Música', 'https://images.pexels.com/photos/167636/pexels-photo-167636.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Tecnologia', 'Discussões sobre as últimas novidades em tecnologia, programação e inovação.', 'Tecnologia', 'https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Jogos Retrô', 'Para os amantes dos jogos clássicos! Arcade, Atari, Nintendo e muito mais.', 'Jogos', 'https://images.pexels.com/photos/1298601/pexels-photo-1298601.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Humor', 'O melhor do humor brasileiro! Piadas, memes e muita diversão.', 'Entretenimento', 'https://images.pexels.com/photos/1477166/pexels-photo-1477166.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Receitas da Vovó', 'Compartilhe e descubra receitas tradicionais e caseiras.', 'Culinária', 'https://images.pexels.com/photos/1556698/pexels-photo-1556698.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Filmes Cult', 'Para cinéfilos e amantes de filmes alternativos e cult.', 'Cinema', 'https://images.pexels.com/photos/918281/pexels-photo-918281.jpeg?auto=compress&cs=tinysrgb&w=200'),
('Viagens pelo Brasil', 'Descubra os destinos mais incríveis do nosso país!', 'Turismo', 'https://images.pexels.com/photos/1804177/pexels-photo-1804177.jpeg?auto=compress&cs=tinysrgb&w=200');

-- Update members count (will be updated by triggers in real implementation)
UPDATE communities SET members_count = FLOOR(RANDOM() * 5000) + 100;