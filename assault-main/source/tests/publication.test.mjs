import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('release publication keeps downloads consistent across rebuilds and concurrent readers', () => {
  const result = spawnSync(process.platform === 'win32' ? 'python' : 'python3', ['tests/publication-check.py'], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.error?.message || result.stderr || result.stdout);
});
