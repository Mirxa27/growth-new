import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkDeploymentReadiness() {
  console.log('🔍 Checking deployment readiness...\n');
  
  const checks = {
    envFile: false,
    buildOutput: false,
    migrations: false,
    edgeFunctions: false,
    configFiles: false
  };
  
  // Check 1: Environment variables
  console.log('1️⃣ Checking environment variables...');
  try {
    await fs.access('.env');
    const envContent = await fs.readFile('.env', 'utf8');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY'
    ];
    
    const missingVars = requiredVars.filter(v => !envContent.includes(v));
    if (missingVars.length === 0) {
      console.log('✅ All required environment variables found');
      checks.envFile = true;
    } else {
      console.log(`❌ Missing environment variables: ${missingVars.join(', ')}`);
    }
  } catch {
    console.log('❌ No .env file found');
  }
  
  // Check 2: Build output
  console.log('\n2️⃣ Checking build output...');
  try {
    await fs.access('dist/index.html');
    const stats = await fs.stat('dist');
    console.log(`✅ Build output found (${new Date(stats.mtime).toLocaleString()})`);
    checks.buildOutput = true;
  } catch {
    console.log('❌ No build output found. Run: npm run build');
  }
  
  // Check 3: Migrations
  console.log('\n3️⃣ Checking migrations...');
  try {
    await fs.access('combined-assessments-migration.sql');
    console.log('✅ Combined migration file found');
    checks.migrations = true;
  } catch {
    console.log('❌ No combined migration file. Run: node apply-all-migrations.js');
  }
  
  // Check 4: Edge Functions
  console.log('\n4️⃣ Checking edge functions...');
  try {
    await fs.access('supabase/functions/create-assessment/index.ts');
    console.log('✅ Edge function found');
    checks.edgeFunctions = true;
  } catch {
    console.log('❌ Edge function not found');
  }
  
  // Check 5: Config files
  console.log('\n5️⃣ Checking configuration files...');
  const configFiles = ['vercel.json', 'capacitor.config.ts', 'vite.config.ts'];
  let allConfigsFound = true;
  
  for (const file of configFiles) {
    try {
      await fs.access(file);
      console.log(`✅ ${file} found`);
    } catch {
      console.log(`❌ ${file} missing`);
      allConfigsFound = false;
    }
  }
  checks.configFiles = allConfigsFound;
  
  // Summary
  console.log('\n📊 Deployment Readiness Summary:');
  const readyCount = Object.values(checks).filter(v => v).length;
  const totalCount = Object.keys(checks).length;
  
  if (readyCount === totalCount) {
    console.log('✅ All checks passed! Ready for deployment.');
    console.log('\n🚀 Deploy with: vercel --prod');
  } else {
    console.log(`⚠️  ${readyCount}/${totalCount} checks passed.`);
    console.log('\n📝 Fix the issues above before deploying.');
  }
  
  // Additional recommendations
  console.log('\n💡 Deployment Checklist:');
  console.log('1. Apply migrations in Supabase SQL editor');
  console.log('2. Deploy edge functions: ./deploy-edge-functions.sh');
  console.log('3. Set environment variables in Vercel dashboard');
  console.log('4. Deploy to Vercel: vercel --prod');
  console.log('5. Test all assessments after deployment');
}

checkDeploymentReadiness().catch(console.error);