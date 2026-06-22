# GayVN SkyStream Stream Fix Build

This build repairs the converted SkyStream repository by tightening card parsing and improving stream extraction.

## Upload

Copy the contents of this folder to the root of the `skystream` branch.

```powershell
git switch skystream
git add repo.json dist plugins stream-fix-report.json README_STREAM_FIX.md
git commit -m "Fix SkyStream card parsing and stream extraction"
git push origin skystream
```

## SkyStream repo URL

```text
https://raw.githubusercontent.com/donatelloroberto/gayvn-cs/skystream/repo.json
```

## Important

After pushing, delete the old plugins inside SkyStream and download the updated versions again. All plugin versions were bumped to force refresh.
