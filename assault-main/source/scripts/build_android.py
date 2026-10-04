#!/usr/bin/env python3
"""Build the native Manager and embedded loader with the Android toolchain."""
from contextlib import contextmanager
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import secrets
import subprocess
import tempfile
import time
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()



@contextmanager
def signing_lock(directory):
    # Keep this file: removing it could let another process lock a different inode.
    descriptor = os.open(directory / ".identity.lock", os.O_RDWR | os.O_CREAT, 0o600)
    with os.fdopen(descriptor, "r+b") as lock:
        if os.name == "nt":
            import msvcrt
            if os.fstat(lock.fileno()).st_size == 0:
                lock.write(b"\0")
                lock.flush()
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


def signing_environment():
    environment = os.environ.copy()
    if environment.get("ASSAULT_KEYSTORE_PATH"):
        if not environment.get("ASSAULT_SIGNING_PASSWORD"):
            raise SystemExit("ASSAULT_SIGNING_PASSWORD is required with ASSAULT_KEYSTORE_PATH")
        if not Path(environment["ASSAULT_KEYSTORE_PATH"]).is_file():
            raise SystemExit("The configured signing keystore is missing; restore the original keystore.")
        return environment
    signing = Path.home() / ".local/share/assault/signing"
    signing.mkdir(parents=True, exist_ok=True, mode=0o700)
    signing.chmod(0o700)
    with signing_lock(signing):
        password_file = signing / "password"
        keystore = signing / "manager.p12"
        if keystore.exists() and not password_file.exists():
            raise SystemExit("The persistent Manager signing password is missing; restore it instead of generating a new identity.")
        if password_file.exists() and not keystore.exists():
            raise SystemExit("The persistent Manager signing keystore is missing; restore it instead of generating a new identity.")
        environment["ASSAULT_KEYSTORE_PATH"] = str(keystore)
        if password_file.exists():
            environment["ASSAULT_SIGNING_PASSWORD"] = password_file.read_text().strip()
        else:
            with tempfile.TemporaryDirectory(prefix="initialize-", dir=signing) as staging:
                staged_password = Path(staging) / "password"
                staged_keystore = Path(staging) / "manager.p12"
                environment["ASSAULT_SIGNING_PASSWORD"] = secrets.token_urlsafe(32)
                descriptor = os.open(staged_password, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
                with os.fdopen(descriptor, "w") as out:
                    out.write(environment["ASSAULT_SIGNING_PASSWORD"])
                subprocess.run(["keytool", "-genkeypair", "-keystore", str(staged_keystore), "-storetype", "PKCS12",
                                "-storepass:env", "ASSAULT_SIGNING_PASSWORD", "-keypass:env", "ASSAULT_SIGNING_PASSWORD",
                                "-alias", "assault", "-keyalg", "RSA", "-keysize", "3072", "-validity", "10950",
                                "-dname", "CN=Assault Manager", "-noprompt"], env=environment, check=True)
                staged_keystore.chmod(0o600)
                staged_keystore.replace(keystore)
                staged_password.replace(password_file)
    return environment


@contextmanager
def publication_lock(releases):
    """Same atomic directory lock used by portal publishers sharing this path."""
    releases.mkdir(parents=True, exist_ok=True)
    lock = releases / '.publication.lock'
    deadline = time.monotonic() + 30
    while True:
        try:
            lock.mkdir()
            break
        except FileExistsError:
            if time.monotonic() >= deadline:
                raise RuntimeError('Another publisher holds .publication.lock; confirm it has stopped before removing a stale lock') from None
            time.sleep(0.05)
    try:
        yield
    finally:
        lock.rmdir()


def publish(apk, releases, loader=None):
    with publication_lock(releases):
        return _publish_unlocked(apk, releases, loader)


def _publish_unlocked(apk, releases, loader=None):
    """Publish a snapshot before atomically switching its manifest pointer."""
    releases.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".publish-", dir=releases) as staging:
        staging = Path(staging)
        snapshot = staging / "snapshot.apk"
        shutil.copy2(apk, snapshot)
        sha256 = digest(snapshot)
        immutable = releases / f"Assault-Manager-{sha256}.apk"
        snapshot.replace(immutable)
        # Compatibility/GitHub asset name; the portal manifest always uses immutable.
        alias = staging / "Assault-Manager.apk"
        shutil.copy2(immutable, alias)
        alias.replace(releases / alias.name)
        manifest = {"version": json.loads((ROOT / "package.json").read_text())["version"], "manager": {"url": f"/releases/{immutable.name}", "size": immutable.stat().st_size, "sha256": sha256}}
        if loader is not None:
            loader_snapshot = staging / "loader.apk"
            shutil.copy2(loader, loader_snapshot)
            loader_sha = digest(loader_snapshot)
            loader_name = f"Assault-Loader-{loader_sha}.apk"
            loader_size = loader_snapshot.stat().st_size
            loader_snapshot.replace(releases / loader_name)
            loader_alias = staging / "Assault-Loader.apk"
            shutil.copy2(releases / loader_name, loader_alias)
            loader_alias.replace(releases / loader_alias.name)
            manifest["loader"] = {"url": f"/releases/{loader_name}", "size": loader_size, "sha256": loader_sha}
        sums = staging / "SHA256SUMS"
        sums.write_text(''.join(f"{entry['sha256']}  Assault-{component.title()}.apk\n" for component, entry in manifest.items() if component in ('manager', 'loader')))
        sums.replace(releases / sums.name)
        pointer = staging / "manifest.json"
        pointer.write_text(json.dumps(manifest, indent=2) + "\n")
        pointer.replace(releases / pointer.name)
    return releases / "Assault-Manager.apk"


def verify_loader_assets(loader):
    """Reject a signed but nonfunctional loader before embedding or publishing it."""
    with zipfile.ZipFile(loader) as archive:
        for name in ("xposed_init", "assault-runtime.js", "assault.js", "account-controls.js", "rich-presence.js", "history-export.js", "html-export.js", "licenses/Revenge-BSD-3-Clause.txt"):
            entry = archive.getinfo("assets/" + name)
            if entry.file_size > 16 * 1024 * 1024:
                raise RuntimeError(f"Loader asset exceeds uncompressed size limit: {name}")
            if not archive.read(entry):
                raise RuntimeError(f"Loader asset is empty: {name}")
        if archive.read("assets/xposed_init").decode().strip() != "app.assault.loader.AssaultLoader":
            raise RuntimeError("Unexpected loader entry point")
        if "assets/revenge.js" in archive.namelist():
            raise RuntimeError("Duplicate unbranded runtime in loader")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--all-variants", action="store_true", help="Also build and lint debug APKs")
    args = parser.parse_args()
    sdk = os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT")
    if not sdk or not (Path(sdk) / "platforms/android-36/android.jar").is_file():
        raise SystemExit("Set ANDROID_HOME to an SDK containing platforms;android-36 and build-tools;36.0.0. Java 21 is required.")
    for dependency in json.loads((ROOT / "scripts/android-dependencies.json").read_text()):
        destination = ROOT / dependency["path"]
        if destination.is_file() and digest(destination) == dependency["sha256"]:
            continue
        destination.parent.mkdir(parents=True, exist_ok=True)
        temporary = destination.with_suffix(".download")
        request = urllib.request.Request(dependency["url"], headers={"User-Agent": "Assault-Build/2.7.0"})
        with urllib.request.urlopen(request, timeout=120) as response, temporary.open("wb") as out:
            if not response.url.startswith("https://"):
                raise RuntimeError("Refusing insecure dependency redirect")
            shutil.copyfileobj(response, out)
        if digest(temporary) != dependency["sha256"]:
            temporary.unlink()
            raise RuntimeError(f"Dependency checksum mismatch: {destination.name}")
        temporary.replace(destination)
    # GRADLE may point to an already installed 8.13 distribution in CI.
    gradle = os.environ.get("GRADLE", str(ROOT / "android" / ("gradlew.bat" if os.name == "nt" else "gradlew")))
    variants = ["release", "debug"] if args.all_variants else ["release"]
    tasks = [f":{module}:{task}{variant.capitalize()}"
             for variant in variants for module in ("manager", "loader") for task in ("assemble", "lint")]
    subprocess.run([gradle, "-p", str(ROOT / "android"), *tasks, "--console=plain"], env=signing_environment(), check=True)
    apk = ROOT / "android/manager/build/outputs/apk/release/manager-release.apk"
    apksigner = "apksigner.bat" if os.name == "nt" else "apksigner"
    for variant in variants:
        for module in ("manager", "loader"):
            artifact = ROOT / f"android/{module}/build/outputs/apk/{variant}/{module}-{variant}.apk"
            subprocess.run([str(Path(sdk) / "build-tools/36.0.0" / apksigner), "verify", "--verbose", str(artifact)], check=True)
            zipalign = "zipalign.exe" if os.name == "nt" else "zipalign"
            subprocess.run([str(Path(sdk) / "build-tools/36.0.0" / zipalign), "-c", "-P", "16", "4", str(artifact)], check=True)
        manager = ROOT / f"android/manager/build/outputs/apk/{variant}/manager-{variant}.apk"
        loader = ROOT / f"android/loader/build/outputs/apk/{variant}/loader-{variant}.apk"
        verify_loader_assets(loader)
        with zipfile.ZipFile(manager) as archive:
            if archive.read("assets/loader.apk") != loader.read_bytes():
                raise RuntimeError(f"{variant} Manager does not embed the matching loader")
    target = publish(apk, ROOT / "public/releases", ROOT / "android/loader/build/outputs/apk/release/loader-release.apk")
    print(f"Built {target} ({target.stat().st_size / 1048576:.1f} MiB). Client is fetched and patched on-device.")


if __name__ == "__main__":
    main()
