#!/usr/bin/env python3
"""Apply reviewed fixes to the checksum-pinned runtime without editing its download."""
import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(source, original, replacement):
    if source.count(original) != 1:
        raise ValueError(f"Expected exactly one runtime patch target: {original[:100]}")
    return source.replace(original, replacement, 1)


def patch_runtime(data):
    dependencies = json.loads((ROOT / "scripts/android-dependencies.json").read_text())
    runtime = next(item for item in dependencies if item["path"].endswith("/revenge.js"))
    if hashlib.sha256(data).hexdigest() != runtime["sha256"]:
        raise ValueError("Runtime checksum mismatch; review patches before changing upstream")
    source = data.decode("utf-8")
    start = source.index("  function useProxy(storage) {")
    end = source.index("  var import_react_native, emitterSymbol", start)
    source = source[:start] + (ROOT / "scripts/runtime-patches/storage-hooks.js").read_text() + source[end:]
    source = replace_once(source, 'if (typeof value === "object") {\n            if (childrens.has(value))',
                          'if (value !== null && typeof value === "object") {\n            if (childrens.has(value))')
    source = replace_once(source, 'src_default = () => _async_to_generator(function* () {\n        yield Promise.all([',
                          'src_default = () => _async_to_generator(function* () {\n'
                          '        yield awaitStorage(settings, loaderConfig, themes, fonts, VdPluginManager.plugins);\n'
                          '        yield Promise.all([')
    source = replace_once(source, 'useProxy(VdPluginManager.plugins[vdPlugin.id]);',
                          'useProxy(VdPluginManager.plugins);')
    source = replace_once(source, 'createMMKVBackend("VENDETTA_SETTINGS")',
                          'createMMKVBackend("VENDETTA_SETTINGS", { developerSettings: false })')
    # These wrappers only forwarded their arguments; keep the same public names.
    for name, argument in (("createProxy", "target"), ("useProxy", "_storage"),
                           ("createStorage", "backend"), ("wrapSync", "store")):
        source = replace_once(source, f'{name}: ({argument}) => {name}({argument}),', f'{name},')
    source = replace_once(source, '            awaitSyncWrapper: (store) => awaitStorage(store),',
                          '            getStorageState,\n            useStorageState,\n'
                          '            awaitSyncWrapper: (store) => awaitStorage(store),')
    source = replace_once(source, 'var { ClientInfoManager } = (init_modules(), __toCommonJS(modules_exports));',
                          'var buildNumber = "unknown";\n'
                          '        try {\n'
                          '          var { NativeClientInfoModule } = (init_modules(), __toCommonJS(modules_exports));\n'
                          '          buildNumber = NativeClientInfoModule?.getConstants?.()?.Build ?? "unknown";\n'
                          '        } catch {}')
    source = replace_once(source, 'Build Number: ${ClientInfoManager.getConstants().Build}', 'Build Number: ${buildNumber}')
    return source


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    args.output.write_text(patch_runtime(args.source.read_bytes()), encoding="utf-8")
