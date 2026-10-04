"""Check immutable downloads and concurrent manifest publication using synthetic bytes."""
import concurrent.futures
import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import threading

spec = importlib.util.spec_from_file_location("build_android", Path(__file__).resolve().parents[1] / "scripts/build_android.py")
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)

with tempfile.TemporaryDirectory() as temporary:
    root = Path(temporary)
    releases = root / "releases"
    sources = [root / f"input-{i}.apk" for i in range(2)]
    for i, source in enumerate(sources):
        source.write_bytes(bytes([i + 1]) * 4096)
    loader = root / "loader.apk"
    loader.write_bytes(b"synthetic loader")
    build.publish(sources[0], releases, loader)
    old = json.loads((releases / "manifest.json").read_text())
    old_file = releases / Path(old["manager"]["url"]).name
    build.publish(sources[1], releases, loader)
    assert old_file.read_bytes() == sources[0].read_bytes(), "An old download URL changed bytes"

    def check_snapshot():
        manifest = json.loads((releases / "manifest.json").read_text())
        data = (releases / Path(manifest["manager"]["url"]).name).read_bytes()
        assert len(data) == manifest["manager"]["size"]
        assert hashlib.sha256(data).hexdigest() == manifest["manager"]["sha256"]
        payload = (releases / Path(manifest["loader"]["url"]).name).read_bytes()
        assert len(payload) == manifest["loader"]["size"]
        assert hashlib.sha256(payload).hexdigest() == manifest["loader"]["sha256"]

    done = threading.Event()
    ready = threading.Event()

    def reader():
        checks = 0
        while not done.is_set():
            check_snapshot()
            checks += 1
            ready.set()
        check_snapshot()
        return checks

    def writer(source):
        for _ in range(20):
            build.publish(source, releases, loader)

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as workers:
        reads = workers.submit(reader)
        try:
            assert ready.wait(timeout=5), "Reader did not start"
            writes = [workers.submit(writer, source) for source in sources]
            for write in writes:
                write.result(timeout=15)
        finally:
            done.set()
        assert reads.result(timeout=5) > 0
    before = (releases / "manifest.json").read_bytes()
    try:
        build.publish(root / "missing.apk", releases)
        raise AssertionError("Missing input unexpectedly published")
    except FileNotFoundError:
        pass
    assert before == (releases / "manifest.json").read_bytes()
    assert not list(releases.glob(".publish-*")), "Temporary publication files leaked"
print("PASS: immutable old links, concurrent checksum/size consistency, failed publication rollback")
