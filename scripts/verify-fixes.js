#!/usr/bin/env node

/**
 * Script de verificação para testar se as correções de erro foram aplicadas
 * Este script verifica se os problemas principais foram resolvidos
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando correções aplicadas...\n');

const checks = [
  {
    name: 'Polyfills atualizados',
    description: 'Verificando se os polyfills foram melhorados',
    test: () => {
      const polyfillsPath = path.join(process.cwd(), 'lib', 'polyfills.ts');
      if (!fs.existsSync(polyfillsPath)) return false;
      
      const content = fs.readFileSync(polyfillsPath, 'utf8');
      return content.includes('IntersectionObserver') && 
             content.includes('ResizeObserver') &&
             content.includes('performance.mark');
    }
  },
  {
    name: 'Contexto de autenticação com tratamento robusto',
    description: 'Verificando se auth-context.tsx tem tratamento de erro melhorado',
    test: () => {
      const authPath = path.join(process.cwd(), 'contexts', 'auth-context.tsx');
      if (!fs.existsSync(authPath)) return false;
      
      const content = fs.readFileSync(authPath, 'utf8');
      return content.includes('typeof window === \'undefined\'') && 
             content.includes('console.error') &&
             content.includes('Auth Provider não configurado');
    }
  },
  {
    name: 'Hook de notificações com tratamento de erro',
    description: 'Verificando se use-call-notifications.ts tem try/catch para getSession',
    test: () => {
      const hookPath = path.join(process.cwd(), 'hooks', 'use-call-notifications.ts');
      if (!fs.existsSync(hookPath)) return false;
      
      const content = fs.readFileSync(hookPath, 'utf8');
      return content.includes('} catch (sessionError)') && 
             content.includes('Erro ao obter sessão');
    }
  },
  {
    name: 'PasteDB Auth com tratamento robusto',
    description: 'Verificando se pastedb-auth-context.tsx tem fallbacks seguros',
    test: () => {
      const pastedbPath = path.join(process.cwd(), 'contexts', 'pastedb-auth-context.tsx');
      if (!fs.existsSync(pastedbPath)) return false;
      
      const content = fs.readFileSync(pastedbPath, 'utf8');
      return content.includes('typeof window === \'undefined\'') && 
             content.includes('localStorage.getItem(SESSION_KEY)') &&
             content.includes('} catch (localStorageError)');
    }
  },
  {
    name: 'Hook de configurações de notificação atualizado',
    description: 'Verificando se use-notification-settings.ts tem tratamento de erro',
    test: () => {
      const settingsPath = path.join(process.cwd(), 'hooks', 'use-notification-settings.ts');
      if (!fs.existsSync(settingsPath)) return false;
      
      const content = fs.readFileSync(settingsPath, 'utf8');
      return content.includes('} catch (supabaseError)') && 
             content.includes('Error accessing Supabase');
    }
  }
];

let passedChecks = 0;
const totalChecks = checks.length;

checks.forEach(check => {
  const passed = check.test();
  const status = passed ? '✅' : '❌';
  
  console.log(`${status} ${check.name}`);
  console.log(`   ${check.description}`);
  
  if (passed) {
    passedChecks++;
  } else {
    console.log(`   ⚠️  Verificação falhou`);
  }
  console.log();
});

console.log(`\n📊 Resultado: ${passedChecks}/${totalChecks} verificações passaram\n`);

if (passedChecks === totalChecks) {
  console.log('🎉 Todas as correções foram aplicadas com sucesso!');
  console.log('💡 Agora você pode testar no browser para verificar se os erros foram resolvidos.');
  console.log('\n🔧 Próximos passos:');
  console.log('1. Execute `npm run dev` para iniciar o servidor');
  console.log('2. Abra o DevTools (F12) no browser');
  console.log('3. Verifique se os erros do console foram reduzidos');
  console.log('4. Teste as funcionalidades principais da aplicação');
} else {
  console.log('⚠️  Algumas correções podem não ter sido aplicadas corretamente.');
  console.log('👉 Revise os arquivos mencionados acima.');
}

console.log('\n📝 Resumo das correções aplicadas:');
console.log('• Melhorados polyfills para compatibilidade com Edge e outros browsers');
console.log('• Adicionado tratamento robusto de erro nos contextos de autenticação');
console.log('• Corrigidos problemas com chamadas getSession() nos hooks');
console.log('• Implementados fallbacks seguros para evitar crashes');
console.log('• Adicionado tratamento para localStorage e fetch failures');

process.exit(passedChecks === totalChecks ? 0 : 1);
