import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeBuild() {
  console.log('🔧 Optimizing build for Vercel...');
  
  // Remove unnecessary files from dist
  const distPath = path.join(__dirname, '..', 'dist');
  const unnecessaryFiles = [
    '*.map',
    '*.LICENSE.txt',
    'audio-worklet-processor.js',
    'audio-processor.js'
  ];
  
  try {
    for (const pattern of unnecessaryFiles) {
      const files = await fs.readdir(distPath);
      const toDelete = files.filter(f => {
        if (pattern.includes('*')) {
          const ext = pattern.replace('*', '');
          return f.endsWith(ext);
        }
        return f === pattern;
      });
      
      for (const file of toDelete) {
        await fs.unlink(path.join(distPath, file)).catch(() => {});
        console.log(`  Removed: ${file}`);
      }
    }
  } catch (error) {
    console.log('  No files to optimize');
  }
  
  console.log('✅ Build optimization complete');
}

optimizeBuild().catch(console.error);