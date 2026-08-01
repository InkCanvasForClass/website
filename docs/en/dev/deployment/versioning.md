---
title: Versioning Scheme
description: The three parallel version numbers, what each is for, and how to maintain them
---

# Versioning Scheme

ICC-CE maintains **three different version numbers** that serve completely different purposes.
Know which one you are touching.

## 1. version.json &mdash; the build-time version

Driven by **Nerdbank.GitVersioning** (NBGV) and injected centrally from `Directory.Build.props`, so every
project shares one configuration instead of referencing it individually.

```json
{
  "version": "1.7.19.9",
  "nugetPackageVersion": { "semVer": 2, "precision": "revision" },
  "git": { "shortShaLength": 6, "getCommitDetails": "always" },
  "buildNumber": { "sha": true, "useAbbreviatedSha": true },
  "assemblyVersion": { "precision": "revision" }
}
```

Key points:

- Determines the **assembly version**, i.e. what the About box shows
- Precision is `revision` (four segments); build numbers carry an abbreviated commit sha
- NBGV generates it at build time from Git history &mdash; **never hand-edit assembly version attributes**
- Releasing a new version means bumping the `version` field in this file

::: warning Duplicate NBGV references
`Directory.Build.props` sets `NBGVProvidedByDirectoryBuildProps` to mark that NBGV is already injected.
Projects that need a self-contained reference (such as `InkCanvas.PluginSdk` for standalone builds) must check
this property, otherwise you get NU1504 duplicate-reference warnings.
:::

## 2. AutomaticUpdateVersionControl.txt &mdash; the update noticeboard

A plain text file at the repository root containing a single version number:

```
1.7.18.10
```

Its job is to tell already-installed clients **which version they should update to**:

- Clients periodically fetch it and compare against their own version to decide whether to prompt
- It is distributed over several mirror routes so clients in mainland China can reach it
- Its value **may lag behind** `version.json`: after building and publishing a new version you validate it on
  a small scale first, and only then bump this file so all users start seeing the update prompt

::: danger This is the rollout gate
Changing this file makes **every client** start prompting for the update. Only touch it once the new version
is confirmed stable, and be careful not to enter a version that hasn't been published yet.
:::

## 3. Git tags &mdash; release markers

Four-segment release tags that map one-to-one onto GitHub Releases. Convention:

- A trailing `0` marks an **official release**
- A non-zero last segment marks an iteration / pre-release on that version line

The download page relies on tags to correlate assets across the two repositories: `community-beta` publishes
only portable zips, and installers are fetched from the main `community` repository under the **same tag**.
The tags in both repositories must therefore match exactly, or the download page will find no installer.

## How they relate

```
version.json          build time  → determines the assembly version
      │
      ▼
Git tag + Release     release time → tag and upload artifacts to GitHub
      │
      ▼
AutomaticUpdate...txt rollout time → decides when installed clients are prompted
```

## Version steps in the release process

1. Bump `version` in `version.json`
2. Build the installer and portable artifacts
3. Create the Git tag and the GitHub Release, then upload the artifacts
   - If also publishing to `community-beta`, make sure the tag matches the main repository
4. Validate on a small scale
5. Once confirmed, bump `AutomaticUpdateVersionControl.txt` to push the update prompt

::: tip Rolling back
If a problem shows up, reverting `AutomaticUpdateVersionControl.txt` to the previous stable version stops the
bleeding; you don't need to delete the published Release.
:::
