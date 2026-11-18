#!/usr/bin/env python3
"""Package Forge into store-ready zips.

    python3 scripts/build.py

dist/forge-chromium-<version>.zip  → Chrome Web Store (also Brave, Edge, Opera, Arc, Vivaldi)
dist/forge-firefox-<version>.zip   → addons.mozilla.org (adds Firefox's required gecko settings)
"""
import json
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DIST = ROOT / "dist"

FIREFOX = {
    "gecko": {
        "id": "forge-newtab@forge",
        "strict_min_version": "109.0",
        "data_collection_permissions": {"required": ["none"]},
    }
}


def files():
    for p in sorted(SRC.rglob("*")):
        if p.is_file() and p.name != "manifest.json" and not p.name.startswith("."):
            yield p


def pack(name, manifest):
    DIST.mkdir(exist_ok=True)
    out = DIST / f"forge-{name}-{manifest['version']}.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
        for p in files():
            z.write(p, p.relative_to(SRC).as_posix())
    print("built", out.relative_to(ROOT))


def main():
    manifest = json.loads((SRC / "manifest.json").read_text(encoding="utf-8"))
    pack("chromium", manifest)
    pack("firefox", {**manifest, "browser_specific_settings": FIREFOX})


if __name__ == "__main__":
    main()
