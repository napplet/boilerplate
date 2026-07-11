import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const textExtensions = new Set(['.html', '.json', '.md', '.mjs', '.ts']);
const skippedDirectories = new Set(['.git', 'dist', 'node_modules']);

async function collectTextFiles(directory = root) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTextFiles(path));
    else if (entry.isFile() && textExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

const files = await collectTextFiles();
const sources = new Map(
  await Promise.all(files.map(async (path) => [relative(root, path), await readFile(path, 'utf8')])),
);

test('rejects retired app-owned bootstrap and probing APIs', () => {
  const joined = (...parts) => parts.join('');
  const shimSpecifier = ['@napplet', 'shim'].join('/');
  const patterns = [
    new RegExp(`import\\s+(?:[^'\"]+\\s+from\\s+)?['\"]${shimSpecifier}['\"]`),
    new RegExp(`shell(?:\\.|\\?\\.)${joined('rea', 'dy')}\\s*\\(`),
    new RegExp(`shell(?:\\.|\\?\\.)${joined('in', 'it')}\\s*\\(`),
    new RegExp(`shell(?:\\.|\\?\\.)${joined('supp', 'orts')}\\s*\\(`),
    new RegExp(`window(?:\\.|\\?\\.)napplet(?:\\.|\\?\\.)${joined('sh', 'ell')}`),
    new RegExp(`window\\s*\\[\\s*['\"]napplet['\"]\\s*\\]\\s*(?:\\.|\\?\\.)${joined('sh', 'ell')}`),
    new RegExp(`window\\s*\\[\\s*['\"]napplet['\"]\\s*\\]\\s*\\[\\s*['\"]${joined('sh', 'ell')}['\"]\\s*\\]`),
    new RegExp(`${joined('discover', 'Services')}\\s*\\(`),
    new RegExp(`${joined('has', 'Service')}(?:Version)?\\s*\\(`),
  ];
  const retiredExamples = [
    `import { install } from '${shimSpecifier}';`,
    `shell?.${joined('rea', 'dy')}()`,
    `shell.${joined('in', 'it')}()`,
    `shell.${joined('supp', 'orts')}('storage')`,
    `window?.napplet?.${joined('sh', 'ell')}`,
    `window['napplet']?.${joined('sh', 'ell')}`,
    `window['napplet']['${joined('sh', 'ell')}']`,
    `${joined('discover', 'Services')}()`,
    `${joined('has', 'Service', 'Version')}('relay', '1')`,
  ];

  for (const [index, example] of retiredExamples.entries()) {
    assert.match(example, patterns[index]);
  }

  for (const [path, source] of sources) {
    for (const pattern of patterns) assert.doesNotMatch(source, pattern, path);
  }
});

test('keeps normal Nostr examples OUTBOX-first', () => {
  const main = sources.get('src/main.ts');
  const patterns = ['query', 'subscribe', 'publish'].map(
    (operation) => new RegExp(['relay', operation].join('\\.') + '\\s*\\('),
  );
  for (const pattern of patterns) assert.doesNotMatch(main, pattern);
  assert.match(main, /outbox\.query\s*\(/);

  const joined = (...parts) => parts.join('');
  const directCallPatterns = [
    new RegExp(`window(?:\\.|\\?\\.)napplet(?:\\.|\\?\\.)[A-Za-z_$][\\w$]*(?:\\.|\\?\\.)[A-Za-z_$][\\w$]*\\s*\\(`),
    new RegExp(`window\\s*\\[\\s*['\"]napplet['\"]\\s*\\]\\s*\\[\\s*['\"][^'\"]+['\"]\\s*\\]\\s*(?:\\.|\\?\\.)[A-Za-z_$][\\w$]*\\s*\\(`),
  ];
  const directCallExamples = [
    `window?.napplet?.storage.${joined('get', 'Item')}('key')`,
    `window['napplet']['outbox'].${joined('qu', 'ery')}([])`,
  ];
  for (const [index, example] of directCallExamples.entries()) {
    assert.match(example, directCallPatterns[index]);
  }
  for (const [path, source] of sources) {
    if (!path.startsWith('src/')) continue;
    for (const pattern of directCallPatterns) assert.doesNotMatch(source, pattern, path);
  }

  const designPatterns = sources.get('docs/design-patterns.md');
  assert.match(designPatterns, /OUTBOX-first/i);
  assert.match(designPatterns, /relay-local escape hatch/i);
});

test('ships no forked skill body and declares no optional demo requirement', () => {
  const skillBodies = [...sources.keys()].filter(
    (path) => path.startsWith('.codex/skills/') && path.endsWith('/SKILL.md'),
  );
  assert.deepEqual(skillBodies, []);
  assert.match(sources.get('.codex/skills/README.md'), /npx @napplet\/skills install --to codex/);
  const viteConfig = sources.get('vite.config.ts');
  assert.match(viteConfig, /artifactMode:\s*'single-file'/);
  assert.doesNotMatch(viteConfig, /\brequires\s*:/);
  assert.doesNotMatch(viteConfig, /\bconfigSchema\b/);
  assert.equal(sources.has('config.schema.json'), false);
  const retiredSingleFilePlugin = new RegExp(['vite-plugin', 'singlefile'].join('-'));
  for (const source of sources.values()) assert.doesNotMatch(source, retiredSingleFilePlugin);
});

test('keeps deferred domains out of active package surfaces', () => {
  const joined = (...parts) => parts.join('');
  const domains = [joined('con', 'nect'), joined('cl', 'ass')];

  for (const domain of domains) {
    const patterns = [
      new RegExp(`@napplet/nap/${domain}\\b`),
      new RegExp(`window(?:\\.|\\?\\.)napplet(?:\\.|\\?\\.)${domain}\\b`),
      new RegExp(`window\\s*\\[\\s*['\"]napplet['\"]\\s*\\]\\s*\\[\\s*['\"]${domain}['\"]\\s*\\]`),
      new RegExp(`import\\s*\\{[^}]*\\b${domain}\\b[^}]*\\}\\s*from\\s*['\"]@napplet/sdk['\"]`),
      new RegExp(`\\b${domain.toUpperCase()}_DOMAIN\\b`),
      new RegExp(`\\b${domain}\\s*(?:\\.|\\?\\.)[A-Za-z]\\w*\\s*\\(`),
      new RegExp(`\\brequires\\s*:\\s*\\[[^\\]]*['\"]${domain}['\"]`),
    ];
    const examples = [
      `@napplet/nap/${domain}`,
      `window?.napplet?.${domain}`,
      `window['napplet']['${domain}']`,
      `import { ${domain} } from '@napplet/sdk'`,
      `${domain.toUpperCase()}_DOMAIN`,
      `${domain}.request()`,
      `requires: ['${domain}']`,
    ];

    for (const [index, example] of examples.entries()) {
      assert.match(example, patterns[index]);
    }
    for (const [path, source] of sources) {
      for (const pattern of patterns) assert.doesNotMatch(source, pattern, path);
    }
  }

  for (const label of [joined('NAP-', 'CON', 'NECT'), joined('NAP-', 'CLASS')]) {
    for (const [path, source] of sources) {
      if (source.includes(label)) assert.match(source, /deferred|retired/i, path);
    }
  }
});

test('treats injected optional-domain absence as a normal state', async () => {
  const helperSource = await readFile(join(root, 'src/domain-availability.ts'), 'utf8');
  const compiled = ts.transpileModule(helperSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  runInNewContext(compiled, { module, exports: module.exports });
  const { hasDomain } = module.exports;

  assert.equal(hasDomain(undefined, 'outbox'), false);
  assert.equal(hasDomain({}, 'outbox'), false);
  assert.equal(hasDomain({ outbox: null }, 'outbox'), false);
  assert.equal(hasDomain({ outbox: {} }, 'outbox'), true);
  assert.equal(hasDomain(Object.create({ outbox: {} }), 'outbox'), true);

  const main = sources.get('src/main.ts');
  for (const control of ['outbox', 'storage', 'identity', 'resource', 'notify']) {
    assert.match(main, new RegExp(`elements\\.${control}Button\\.disabled = !runtimeHasDomain`));
  }
  assert.match(main, /if \(!runtimeHasDomain\(IDENTITY_DOMAIN\)\) return;/);
});
