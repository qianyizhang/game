#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { checkGovernance } from './governance.mjs';
import { applyRetention, planRetention } from './retention.mjs';
import { inventoryArtifacts } from './inventory.mjs';
import { auditCommittedFiles, formatCommittedAudit, parseAuditArgs } from './committed-files.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const [command = 'help', ...args] = process.argv.slice(2);
try {
  if (command === 'check' && args.length === 0) {
    const report = checkGovernance(root);
    console.log(JSON.stringify(report, null, 2));
    if (report.errors.length) process.exitCode = 1;
  } else if (command === 'inventory' && args.length === 0) {
    console.log(JSON.stringify(await inventoryArtifacts(root), null, 2));
  } else if (command === 'files') {
    const options = parseAuditArgs(args);
    const report = await auditCommittedFiles(root, options);
    console.log(
      options.json ? JSON.stringify(report, null, 2) : formatCommittedAudit(report, options.top),
    );
  } else if (
    command === 'prune' &&
    (args.length === 0 || (args.length === 1 && args[0] === '--apply'))
  ) {
    const now = new Date();
    const plan = planRetention(root, now);
    console.log(
      JSON.stringify(
        {
          mode: args.length ? 'apply' : 'dry-run',
          protected:
            'All paths outside test-results/disposable and .work/sessions; tracked files; unclassified or changed entries',
          plan,
          result: args.length ? applyRetention(root, plan, now) : [],
        },
        null,
        2,
      ),
    );
  } else if (command === 'help' && args.length === 0) {
    console.log(
      'maintenance check | inventory | files [--ref HEAD] [--top 20] [--min-bytes 262144] [--min-lines 1000] [--json] | prune [--apply]\nFiles audits committed blobs read-only. Inventory is read-only. Prune defaults to a dry run. Only closed, unchanged, explicitly disposable entries can expire.',
    );
  } else {
    throw new Error('Unknown command or arguments. Use maintenance help.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
