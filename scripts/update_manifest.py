
#!/usr/bin/env python3
import argparse, json, os, sys, re, pathlib
from urllib.parse import quote

def update_urls(manifest_path, repo, tag):
    p = pathlib.Path(manifest_path)
    if not p.exists():
        return False, f"{manifest_path} not found"
    data = json.loads(p.read_text(encoding="utf-8"))
    changed = False
    if isinstance(data, dict) and "plugins" in data and isinstance(data["plugins"], list):
        for pl in data["plugins"]:
            # Determine filename from existing URL or name
            filename = None
            if isinstance(pl.get("url"), str):
                maybe = pl["url"].split("/")[-1]
                if maybe.endswith(".cs3"):
                    filename = maybe
            if not filename:
                # fallback from name
                n = pl.get("name")
                if n:
                    filename = f"{n}.cs3"
            if not filename:
                continue
            new_url = f"https://github.com/{repo}/releases/download/{tag}/{quote(filename)}"
            if pl.get("url") != new_url:
                pl["url"] = new_url
                changed = True
            # Optional: set version from tag (strip leading 'v')
            ver = tag[1:] if tag.startswith("v") else tag
            if pl.get("version") != ver:
                pl["version"] = ver
                changed = True
    else:
        return False, "Manifest missing 'plugins' list"
    if changed:
        p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return changed, None

def update_plugins(plugins_path, repo, tag):
    p = pathlib.Path(plugins_path)
    if not p.exists():
        return False, f"{plugins_path} not found"
    data = json.loads(p.read_text(encoding="utf-8"))
    changed = False
    if isinstance(data, list):
        for pl in data:
            filename = None
            if isinstance(pl.get("url"), str):
                maybe = pl["url"].split("/")[-1]
                if maybe.endswith(".cs3"):
                    filename = maybe
            if not filename:
                n = pl.get("name")
                if n:
                    filename = f"{n}.cs3"
            if not filename:
                continue
            new_url = f"https://github.com/{repo}/releases/download/{tag}/{quote(filename)}"
            if pl.get("url") != new_url:
                pl["url"] = new_url
                changed = True
            ver = tag[1:] if tag.startswith("v") else tag
            if pl.get("version") != ver:
                pl["version"] = ver
                changed = True
    else:
        return False, "plugins.json not a list"
    if changed:
        p.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return changed, None

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True)
    ap.add_argument("--tag", required=True)
    ap.add_argument("--manifest", default="manifest/repository.json")
    ap.add_argument("--plugins", default="manifest/plugins.json")
    args = ap.parse_args()

    any_changed = False
    ok, err = update_urls(args.manifest, args.repo, args.tag)
    if err:
        print(f"[WARN] {err}")
    else:
        any_changed = any_changed or ok

    ok, err = update_plugins(args.plugins, args.repo, args.tag)
    if err:
        print(f"[WARN] {err}")
    else:
        any_changed = any_changed or ok

    if any_changed:
        print("Manifest updated.")
    else:
        print("No updates made.")
