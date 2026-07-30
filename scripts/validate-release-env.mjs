const releaseEnvironment = (process.env.RELEASE_ENVIRONMENT || '').trim();
const configuredApiOrigin = (process.env.VITE_API_BASE_URL || '').trim();
const errors = [];

if (!['staging', 'production'].includes(releaseEnvironment)) {
  errors.push('RELEASE_ENVIRONMENT must be either staging or production.');
}

if (!configuredApiOrigin) {
  errors.push(
    'VITE_API_BASE_URL is required. Configure it as a GitHub environment variable.'
  );
} else {
  try {
    const parsedOrigin = new URL(configuredApiOrigin);
    const hostname = parsedOrigin.hostname.toLowerCase();
    const loopbackHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);
    const reservedDocumentationHost = ['example.com', 'example.net', 'example.org']
      .some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
    const reservedHostname = ['.invalid', '.test', '.example', '.local']
      .some((suffix) => hostname.endsWith(suffix));

    if (parsedOrigin.protocol !== 'https:') {
      errors.push('VITE_API_BASE_URL must use HTTPS.');
    }
    if (configuredApiOrigin !== parsedOrigin.origin) {
      errors.push('VITE_API_BASE_URL must be an origin without a path, query, hash, or trailing slash.');
    }
    if (loopbackHosts.has(hostname) || hostname.endsWith('.localhost')) {
      errors.push('VITE_API_BASE_URL cannot point to a loopback host.');
    }
    if (reservedDocumentationHost || reservedHostname) {
      errors.push('VITE_API_BASE_URL cannot use a reserved placeholder hostname.');
    }
  } catch {
    errors.push('VITE_API_BASE_URL must be a valid absolute URL.');
  }
}

if (releaseEnvironment === 'production') {
  const releaseRef = process.env.GITHUB_REF || '';
  const isMain = releaseRef === 'refs/heads/main';
  const isReleaseTag = /^refs\/tags\/v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(releaseRef);

  if (!isMain && !isReleaseTag) {
    errors.push('Production artifacts may only be built from main or a semantic v* release tag.');
  }
}

if (errors.length) {
  errors.forEach((error) => process.stderr.write(`ERROR: ${error}\n`));
  process.exit(1);
}

const apiHostname = new URL(configuredApiOrigin).hostname;
process.stdout.write(`Validated ${releaseEnvironment} release API origin: ${apiHostname}\n`);
