import fs from 'fs-extra';
import path from 'path';

const buildExtension = async () => {
  const extensionSrc = path.resolve('extension');
  const extensionDest = path.resolve('dist/extension');

  try {
    // Clean destination directory
    await fs.emptyDir(extensionDest);

    // Copy extension files
    await fs.copy(extensionSrc, extensionDest);

    // Read and modify manifest
    const manifestPath = path.join(extensionDest, 'manifest.json');
    const manifest = await fs.readJson(manifestPath);

    // Ensure content script is a module
    if (manifest.content_scripts) {
      manifest.content_scripts = manifest.content_scripts.map(script => ({
        ...script,
        type: 'module',
      }));
    }

    await fs.writeJson(manifestPath, manifest, { spaces: 2 });

    console.log('Extension build successful!');
  } catch (error) {
    console.error('Extension build failed:', error);
  }
};

buildExtension();