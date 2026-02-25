import fs from 'node:fs';
import path from 'node:path';

import { resolveTemplateDir } from './template-roots.js';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function requireFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required template package file: ${filePath}`);
  }
  return filePath;
}

export function loadTemplatePackage(templateName = 'kpmg-diligence') {
  const templateDir = resolveTemplateDir(templateName);
  const packageDir = path.join(templateDir, 'package');

  const tokensPath = requireFile(path.join(packageDir, 'tokens.json'));
  const layoutsPath = requireFile(path.join(packageDir, 'layouts.json'));
  const assetsManifestPath = requireFile(path.join(packageDir, 'assets', 'manifest.json'));

  const tokens = readJson(tokensPath);
  const layouts = readJson(layoutsPath);
  const assetsManifest = readJson(assetsManifestPath);

  const resolveAssetPath = (assetKey) => {
    const entry = assetsManifest?.assets?.[assetKey];
    if (!entry?.path) return null;
    return path.resolve(templateDir, entry.path);
  };

  return {
    templateName,
    templateDir,
    packageDir,
    tokens,
    layouts,
    assetsManifest,
    resolveAssetPath,
  };
}
