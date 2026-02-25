import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const GENERATED_TEMPLATE_ROOT = path.join(REPO_ROOT, 'templates');
export function resolveTemplateRoot() {
  if (fs.existsSync(GENERATED_TEMPLATE_ROOT)) {
    return GENERATED_TEMPLATE_ROOT;
  }
  throw new Error(
    `Generated template root not found: ${GENERATED_TEMPLATE_ROOT}. ` +
      'Expected generator templates under /templates and canonical files under /pptx-templates.',
  );
}

export function resolveTemplateDir(templateName = 'kpmg-diligence') {
  return path.join(resolveTemplateRoot(), templateName);
}

export function resolveTemplateAssetsDir(templateName = 'kpmg-diligence') {
  return path.join(resolveTemplateDir(templateName), 'assets');
}
