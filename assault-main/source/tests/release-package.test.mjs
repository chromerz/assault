import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

test('source packaging excludes machine-local signing properties and generated files', () => {
  const code = `
import sys,tempfile
from pathlib import Path
sys.path.insert(0,'scripts')
import pack_release_artifacts as pack
with tempfile.TemporaryDirectory() as tmp:
 pack.ROOT=Path(tmp)
 fixture=['package.json','android/local.properties','android/keystore.properties','scripts/signing.properties','android/gradle.properties','android/gradle/wrapper/gradle-wrapper.jar','android/build/generated.txt','android/deps/excluded.txt','docs/guide.md','android/loader/src/main/assets/revenge.js','android/loader/src/main/assets/rich-presence.js','android/private.p12']
 for name in fixture:
  file=pack.ROOT/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text('synthetic fixture')
 names={str(file.relative_to(pack.ROOT)) for file in pack.source_files()}
 assert names=={'package.json','android/gradle.properties','android/gradle/wrapper/gradle-wrapper.jar','docs/guide.md','android/loader/src/main/assets/rich-presence.js'},names
`;
  const result = spawnSync('python3', ['-c', code], { encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, result.error?.message || result.stderr);
});
