# GayVN SkyStream fixed upload package

Upload the CONTENTS of this folder to the root of a GitHub branch named `skystream`.
Do not upload the folder itself as `gayvn-skystream-fixed-upload/`.

Correct final paths on GitHub:

```text
repo.json
dist/plugins.json
dist/com.gayvn.besthdgayporn.sky
dist/com.gayvn.boyfriendtv.sky
...
```

Correct SkyStream Add Repository URL:

```text
https://raw.githubusercontent.com/donatelloroberto/gayvn-cs/skystream/repo.json
```

Browser check: opening that URL must show JSON starting with `{` and containing `pluginLists`.
If it shows `404: Not Found`, an HTML GitHub page, or the zip file listing, SkyStream will show `Failed to parse repository`.
