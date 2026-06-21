#!/usr/bin/env python3
import json, zipfile, pathlib, sys
root=pathlib.Path(__file__).resolve().parent
json.loads((root/"repo.json").read_text(encoding="utf-8"))
plugins=json.loads((root/"dist"/"plugins.json").read_text(encoding="utf-8"))
for p in plugins:
    sky=root/"dist"/(p["packageName"]+".sky")
    if not sky.exists(): raise SystemExit(f"Missing {sky}")
    with zipfile.ZipFile(sky) as z:
        names=set(z.namelist())
        if {"plugin.js","plugin.json"}-names: raise SystemExit(f"Bad sky {sky}: {names}")
        json.loads(z.read("plugin.json"))
print(f"OK: repo.json + {len(plugins)} plugins + .sky files are valid")
