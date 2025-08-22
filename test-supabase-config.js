// Test Supabase configuration
const { config } = require('dotenv');

// Load environment variables
config({ path: '.env.local' });

console.log('🔍 Testando configurações do Supabase...\n');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined');

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         !supabaseUrl.includes('placeholder') && 
         !supabaseUrl.includes('your_') &&
         supabaseUrl.startsWith('https://');
}

console.log('\n✅ Verificações:');
console.log('- supabaseUrl existe:', !!supabaseUrl);
console.log('- supabaseAnonKey existe:', !!supabaseAnonKey);
console.log('- URL não contém "placeholder":', !supabaseUrl?.includes('placeholder'));
console.log('- URL não contém "your_":', !supabaseUrl?.includes('your_'));
console.log('- URL começa com "https://":', supabaseUrl?.startsWith('https://'));

console.log('\n🎯 isSupabaseConfigured():', isSupabaseConfigured());

if (isSupabaseConfigured()) {
  console.log('✅ Supabase está configurado corretamente!');
} else {
  console.log('❌ Problema na configuração do Supabase');
}
