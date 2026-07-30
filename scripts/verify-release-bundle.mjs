import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const distDirectory = resolve('dist');
const expectedApiOrigin = (process.env.VITE_API_BASE_URL || '').trim();
const requiredFiles = ['index.html', '_headers', '_redirects', 'manifest.json'];
const textExtensions = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.xml']);
const blockedPatterns = [
  ['loopback URL', /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[?::1\]?)(?=[:/]|$)/i],
  [
    'reserved placeholder domain',
    /https?:\/\/(?:[0-9a-z-]+\.)*(?:example\.(?:com|net|org)|[0-9a-z-]+\.(?:invalid|test|example|local))(?=[:/?#\s'"`]|$)/i,
  ],
  ['Stripe secret or webhook secret', /\b(?:sk_(?:live|test)|rk_live|whsec)_[0-9A-Za-z]{8,}\b/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['backend secret assignment', /\b(?:ADMIN_SETUP_TOKEN|DATABASE_PASSWORD|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET)\s*[:=]/],
  ['unresolved Vite API variable', /\bVITE_API_BASE_URL\b/],
];
const errors = [];

if (!existsSync(distDirectory) || !statSync(distDirectory).isDirectory()) {
  errors.push('dist/ does not exist. Run the production build first.');
} else {
  for (const filename of requiredFiles) {
    if (!existsSync(join(distDirectory, filename))) {
      errors.push(`dist/${filename} is missing.`);
    }
  }

  const assetsDirectory = join(distDirectory, 'assets');
  if (!existsSync(assetsDirectory) || !readdirSync(assetsDirectory).length) {
    errors.push('dist/assets is missing or empty.');
  }
}

const files = [];
const collectFiles = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFiles(entryPath);
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }
};

if (existsSync(distDirectory)) {
  collectFiles(distDirectory);
}

const sourceMaps = files.filter((file) => file.endsWith('.map'));
if (sourceMaps.length) {
  errors.push(`Public source maps found: ${sourceMaps.join(', ')}`);
}

const textFiles = files.filter((file) =>
  textExtensions.has(extname(file).toLowerCase())
  || ['_headers', '_redirects'].includes(file.slice(distDirectory.length + 1))
);
let expectedOriginFound = false;

for (const file of textFiles) {
  const contents = readFileSync(file, 'utf8');
  if (expectedApiOrigin && contents.includes(expectedApiOrigin)) {
    expectedOriginFound = true;
  }

  for (const [label, pattern] of blockedPatterns) {
    if (pattern.test(contents)) {
      errors.push(`${label} found in ${file.slice(distDirectory.length + 1)}.`);
    }
  }
}

if (!expectedApiOrigin) {
  errors.push('VITE_API_BASE_URL is unavailable during bundle verification.');
} else if (!expectedOriginFound) {
  errors.push('The configured VITE_API_BASE_URL was not embedded in the release bundle.');
}

if (errors.length) {
  errors.forEach((error) => process.stderr.write(`ERROR: ${error}\n`));
  process.exit(1);
}

process.stdout.write(`Verified ${files.length} release bundle files with no blocked leaks.\n`);
