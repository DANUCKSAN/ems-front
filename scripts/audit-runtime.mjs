import { spawnSync } from 'node:child_process';

// Temporary, narrowly scoped risk acceptance. GHSA-qwww-vcr4-c8h2 applies to
// React Router's RSC/Server Action mode. EventHub is a static declarative
// BrowserRouter application and does not use RSC, SSR, actions, or route action
// handlers. Remove this exception as soon as a patched release is published.
const allowedAdvisorySources = new Set([1124282]);
const includeDevDependencies = process.argv.includes('--include-dev');
const auditArguments = ['audit'];

if (!includeDevDependencies) {
  auditArguments.push('--omit=dev');
}

auditArguments.push('--json');

const audit = spawnSync('npm', auditArguments, {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
  shell: false,
});

if (!audit.stdout?.trim()) {
  process.stderr.write(audit.stderr || 'npm audit returned no report\n');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch (error) {
  process.stderr.write(`Could not parse npm audit output: ${error.message}\n`);
  process.exit(1);
}

if (!report.vulnerabilities || !report.metadata?.vulnerabilities) {
  process.stderr.write(
    `${report.message || audit.stderr || 'npm audit returned an incomplete report'}\n`
  );
  process.exit(1);
}

const vulnerabilities = report.vulnerabilities;
const acceptedAdvisories = new Map();
const memoizedAcceptance = new Map();

const isAcceptedFinding = (name, ancestors = new Set()) => {
  if (memoizedAcceptance.has(name)) {
    return memoizedAcceptance.get(name);
  }

  const finding = vulnerabilities[name];
  if (!finding || ancestors.has(name) || !finding.via?.length) {
    memoizedAcceptance.set(name, false);
    return false;
  }

  const nextAncestors = new Set(ancestors).add(name);
  const accepted = finding.via.every((cause) => {
    if (typeof cause === 'string') {
      return isAcceptedFinding(cause, nextAncestors);
    }

    if (!cause?.source || !allowedAdvisorySources.has(cause.source)) {
      return false;
    }

    acceptedAdvisories.set(cause.source, cause);
    return true;
  });

  memoizedAcceptance.set(name, accepted);
  return accepted;
};

const blocking = Object.entries(vulnerabilities).filter(([, finding]) =>
  ['high', 'critical'].includes(finding.severity)
).filter(([name]) => !isAcceptedFinding(name));

if (blocking.length) {
  for (const [name, finding] of blocking) {
    process.stderr.write(`BLOCKING ${finding.severity}: ${name}\n`);
  }
  process.exit(1);
}

for (const item of acceptedAdvisories.values()) {
  process.stdout.write(`ACCEPTED until patched (unused RSC mode): ${item.title} (${item.url})\n`);
}
process.stdout.write(
  `${includeDevDependencies ? 'Complete' : 'Runtime'} dependency audit gate passed.\n`
);
