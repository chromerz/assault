"""Validate uploaded APK identity, versions, signatures and embedded loader before publication."""
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile
from build_android import verify_loader_assets


def verify_pair(manager, loader, version=None, previous=None):
    if version == '-':
        version = None
    if version is not None and not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Invalid release version')
    sdk = os.environ.get('ANDROID_HOME') or os.environ.get('ANDROID_SDK_ROOT')
    if not sdk:
        raise ValueError('APK verification requires ANDROID_HOME and Android build-tools 36.0.0')
    tools = Path(sdk) / 'build-tools/36.0.0'
    signer_tool = tools / ('apksigner.bat' if os.name == 'nt' else 'apksigner')
    manifest_tool = tools / ('aapt2.exe' if os.name == 'nt' else 'aapt2')
    if not signer_tool.is_file() or not manifest_tool.is_file():
        raise ValueError('APK verification requires Android build-tools 36.0.0; check ANDROID_HOME')
    def inspect(apk, package):
        try:
            signer = subprocess.run([str(signer_tool), 'verify', '--print-certs', str(apk)], check=True, capture_output=True, text=True, timeout=30).stdout
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
            raise ValueError('APK signature verification failed; select a signed APK and check the Java installation') from None
        certificates = re.findall(r'^Signer #\d+ certificate SHA-256 digest: ([a-fA-F0-9]+)$', signer, re.M)
        if not certificates:
            raise ValueError('No APK signing certificate')
        try:
            badging = subprocess.run([str(manifest_tool), 'dump', 'badging', str(apk)], check=True, capture_output=True, text=True, timeout=30).stdout
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, OSError):
            raise ValueError('APK manifest verification failed; select a complete Android APK') from None
        match = re.search(r"package: name='([^']+)' versionCode='(\d+)' versionName='([^']+)'", badging)
        if not match or match[1] != package:
            raise ValueError('Unexpected APK package identity')
        return (match[3], int(match[2]), sorted(certificates))
    current = inspect(manager, 'app.assault.manager')
    module = inspect(loader, 'app.assault.loader')
    if not re.fullmatch(r'\d+\.\d+\.\d+', current[0]):
        raise ValueError('APK version must be a stable semantic version')
    if current != module or (version is not None and current[0] != version):
        raise ValueError('Manager/Loader version or signing certificate mismatch')
    try:
        verify_loader_assets(loader)
    except (RuntimeError, KeyError, zipfile.BadZipFile):
        raise ValueError('Loader verification failed: required runtime assets are missing, empty, invalid or oversized') from None
    with zipfile.ZipFile(manager) as archive:
        try:
            entry = archive.getinfo('assets/loader.apk')
        except KeyError:
            raise ValueError('Manager APK is missing its embedded Loader; select an Assault Manager build') from None
        if entry.file_size != Path(loader).stat().st_size or archive.read(entry) != Path(loader).read_bytes():
            raise ValueError('Manager does not embed the supplied Loader')
    if previous:
        old = inspect(previous, 'app.assault.manager')
        if current[2] != old[2] or current[1] < old[1]:
            raise ValueError('Release signing identity changed or version code decreased')
    return current[0]


if __name__ == '__main__':
    try:
        print(verify_pair(*sys.argv[1:]))
    except Exception as error:
        # Never return subprocess output or request contents to clients.
        print(str(error) if isinstance(error, ValueError) else 'APK verification failed', file=sys.stderr)
        sys.exit(1)
