
# CI: Build & Release for CloudStream Plugins

## What this does
- On tag push (e.g., `v1.2.3`) or manual trigger:
  1. Uploads every `./builds/*.cs3` as Release assets.
  2. Rewrites `manifest/repository.json` and `manifest/plugins.json` so each plugin `url` points to the new release (direct download link).
  3. Sets each plugin `version` to the tag value (without the leading `v`).
  4. Commits the updated manifest back to `main`.

## Setup (once)
1. Copy the `.github/workflows/build-release.yml` and `scripts/update_manifest.py` into your repo.
2. Ensure your `.cs3` files are in `./builds/`.
3. Ensure your `manifest/repository.json` (and optional `manifest/plugins.json`) exist. Use the bundle I generated if you don't have them.
4. Push a tag: `git tag v1.0.0 && git push origin v1.0.0`

> The default `GITHUB_TOKEN` already has `contents: write` in this workflow.
