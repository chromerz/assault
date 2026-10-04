#!/usr/bin/env python3
"""Package compiled, signed APKs; never generate substitute Android binaries."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tempfile
import zipfile
from build_android import ROOT, verify_loader_assets


def source_files():
    """Use an explicit source allowlist so ZIP users do not need Git to repackage."""
    for name in ('README.md', 'package.json', 'package-lock.json', 'tsconfig.json', 'vite.config.ts',
                 'server.ts', 'index.html', 'metadata.json', '.gitignore', '.env.example'):
        source = ROOT / name
        if source.is_file() and not source.is_symlink():
            yield source
    extensions = {'.md', '.java', '.gradle', '.xml', '.properties', '.js', '.mjs', '.ts', '.tsx',
                  '.css', '.html', '.json', '.svg', '.py', '.yml', '.yaml', '.txt', '.bat'}
    excluded = {'build', '.gradle', 'deps', 'releases', '__pycache__', '.idea', '.cxx', 'node_modules'}
    for directory in ('android', 'src', 'scripts', 'tests', 'docs', '.github', 'ci', 'public'):
        for source in sorted((ROOT / directory).rglob('*')):
            relative = source.relative_to(ROOT)
            if any(part in excluded for part in relative.parts) or any(parent.is_symlink() for parent in source.parents if parent != ROOT):
                continue
            if not source.is_file() or source.is_symlink() or source.name in {'revenge.js', 'local.properties', 'keystore.properties', 'signing.properties'}:
                continue
            if source.suffix in extensions or source.name in ('gradlew', 'LICENSE', 'gradle-wrapper.jar'):
                yield source


def package_release(output):
    sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
    if not sdk:
        raise RuntimeError('Set ANDROID_HOME to verify release APKs before packaging')
    artifacts = {}
    for module in ('manager', 'loader'):
        apk = ROOT / f'android/{module}/build/outputs/apk/release/{module}-release.apk'
        if not apk.is_file():
            raise RuntimeError('Build the release first: python3 scripts/build_android.py')
        tools = Path(sdk) / 'build-tools/36.0.0'
        subprocess.run([str(tools / ('apksigner.bat' if os.name == 'nt' else 'apksigner')), 'verify', '--verbose', str(apk)], check=True)
        subprocess.run([str(tools / ('zipalign.exe' if os.name == 'nt' else 'zipalign')), '-c', '-P', '16', '4', str(apk)], check=True)
        artifacts[f'Assault-{module.title()}.apk'] = apk.read_bytes()
    verify_loader_assets(io.BytesIO(artifacts['Assault-Loader.apk']))
    with zipfile.ZipFile(io.BytesIO(artifacts['Assault-Manager.apk'])) as manager:
        if manager.read('assets/loader.apk') != artifacts['Assault-Loader.apk']:
            raise RuntimeError('Manager does not contain the matching release loader')
    version = json.loads((ROOT / 'package.json').read_text())['version']
    # Reject stale build outputs when packaging after a version bump.
    for module in ('manager', 'loader'):
        metadata = json.loads((ROOT / f'android/{module}/build/outputs/apk/release/output-metadata.json').read_text())
        if any(element['versionName'] != version for element in metadata['elements']):
            raise RuntimeError(f'{module} build version does not match {version}; rebuild')
    artifacts['SHA256SUMS'] = ''.join(f'{hashlib.sha256(data).hexdigest()}  {name}\n' for name, data in artifacts.items()).encode()
    artifacts['INSTALL.txt'] = (f'Assault {version}\n\nInstall Assault-Manager.apk on Android 9+. The loader is already embedded.\n'
        'In Manager: Download & prepare client, then Install prepared update.\n'
        'Android asks for installation permission and confirmation.\n'
        'The standalone Loader APK is for advanced use and has no launcher.\n'
        'No Discord APK or private signing keys are included.\n\n'
        'Official Discord uses a different signer. Removing it clears its local data.\n'
        'Preserve Manager app data: it contains your client update signing key.\n'
        'This build can update an existing Manager only if their signing certificates match.\n'
        'See docs/android-validation.md for the device acceptance checklist.\n'
        'Buildable project sources are included under source/.\n'
        'Read docs/publish-your-release.md for GitHub publishing and docs/in-app-controls.md for commands.\n').encode()
    output = Path(output)
    output.mkdir(parents=True, exist_ok=True)
    target = output / f'Assault-{version}-release.zip'
    with tempfile.TemporaryDirectory(dir=output) as staging:
        temporary = Path(staging) / target.name
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as archive:
            for name, data in artifacts.items():
                archive.writestr(name, data)
            for name in ('README.md', 'docs/release-notes.md', 'docs/android-validation.md', 'docs/android-build-release.md', 'docs/publish-your-release.md', 'docs/in-app-controls.md', 'android/LICENSE', 'android/THIRD_PARTY.md'):
                archive.write(ROOT / name, name)
            for source in source_files():
                archive.write(source, f'source/{source.relative_to(ROOT).as_posix()}')
            for license_file in sorted((ROOT / 'android/licenses').glob('*.txt')):
                archive.write(license_file, f'licenses/{license_file.name}')
        temporary.replace(target)
    print(f'Packaged verified release: {target}')
    return target


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-dir', default=str(ROOT / 'release'))
    package_release(parser.parse_args().output_dir)
