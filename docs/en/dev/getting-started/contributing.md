---
title: Contributing
description: Branching strategy, commit conventions, PR checks, and code standards
---

# Contributing

<UnderConstruction />

The main development branch is `net6`. `main` is a legacy branch and is effectively inactive. All PRs should target `net6`.

## Branching strategy

There is only one active development branch: **`net6`**.

```
net6 (main development branch)
  ├─ feature/xxx (feature branches)
  ├─ fix/yyy (fix branches)
  └─ PR → net6
```

Whenever `net6` receives new commits, `sync-net6-to-net10.yml` automatically merges the changes into the `net10` branch (the .NET 10 migration branch). Details at the end of this page.


::: warning Do not push directly to main
Although `prcheck.yml` allows PRs to `main`, all real development happens on `net6`. Unless a maintainer explicitly asks for it, do not submit to `main`.
:::

## Commit message conventions

The project follows [Conventional Commits](https://www.conventionalcommits.org/), and `git-cliff` generates the changelog from commit messages automatically.

### Mapping prefixes to changelog groups

The `commit_parsers` section of `build/cliff.toml` decides which group a commit lands in. **Chinese prefixes are recognized as well**, which is the biggest difference between this setup and standard Conventional Commits:

| Commit message prefix | Changelog group |
| --- | --- |
| `feat` / `add` / `新增` / `添加` | 🚀 New features |
| `fix` / `修复` | 🐛 Fixes |
| `refactor` | 🚜 Refactoring |
| `improve` / `改进` / `优化` | ⚡ Experience improvements |
| `delete` / `删除` / `移除` | ❌ Removed features |
| `doc` | 📚 Documentation changes |
| `style` | 🎨 Formatting |
| `test` | 🧪 Tests |
| `chore` / `ci` | ⚙️ Chores |
| `Revert` | ◀️ Reverts |
| `版本` / `version` / `更新版本号` | 🎉 Version bumps |
| Anything else | 💼 Other changes |

::: warning No commit is ever dropped
`filter_commits = false`, and the last rule is `{ message = ".*", group = "其他更改" }`. Even the sloppiest commit message ends up in the changelog, just under "💼 Other changes". If you want a readable changelog, use the prefixes.
:::

The following categories are skipped explicitly (`skip = true`) and never appear in the changelog:

- `chore(release): prepare for ...`
- `chore(deps...)` — Dependabot dependency updates
- `chore(pr)` / `chore(pull)`
- `Merge branch ...`

::: tip A typical commit
```bash
feat(plugin): allow plugins to register global hotkeys

Add a RegisterHotkey method to IPluginHost so plugins can register global
hotkeys during Initialize.

Closes #1234
```

Writing `#1234` in a commit message gets turned into a link to the corresponding issue in the community repository by `link_parsers`.
:::


## PR check gates

Opening a PR against `net6` or `main` triggers the following checks:

### 1. prcheck.yml — build and packaging

**Triggers**: PR opened/synchronize, with `paths-ignore: ["**/*.md"]` (pure Markdown changes are skipped).

**Matrix**: builds `AnyCPU` and `x86` in parallel.

**Key checks**:

- `dotnet restore --locked-mode` — any `PackageReference` change must come with an updated `packages.lock.json`, otherwise it fails
- Builds the `Debug` configuration with `/p:RunAnalyzers=false` (skips analyzers for speed)
- Verifies the VSTO DLL was produced (`Microsoft.Office.Tools.Common.v4.0.Utilities.dll` must exist)
- Verifies the main executable was produced
- Packages the output and uploads it as an artifact

About certificates: if the `CERT_PFX_BASE64` secret is present, the real certificate is imported; otherwise a self-signed certificate is generated. PRs from forks pass too (they use the self-signed path).

### 2. linter.yml — code checks

**Triggers**: push/PR to `net6`, Markdown ignored as above.

**Linter**: `super-linter v8.6.0`, but with `DISABLE_ERRORS: true` (**reports only, never blocks the PR**).

**Disabled checks**: `VALIDATE_BIOME_FORMAT`, `VALIDATE_SPELL_CODESPELL`, `VALIDATE_GITLEAKS` (secret scanning is off because of the self-signed test certificate).

::: tip The linter will not fail your PR
Even with formatting problems, `linter.yml` only reports them in the summary and will not block the merge. Fixing them is still recommended to keep code quality up.
:::

## Code standards

The complete standards live in the `community/rules/` directory. Listed here are the ones people trip over most.

### General rules (general.md)

1. **All user-visible text must go through i18n**. Never hardcode Chinese or English strings in XAML or code. Use `Strings.GetString("KeyName")`.
2. **The result of `Geometry.Parse()` is read-only**. You must `Clone()` before modifying it, otherwise it throws.
3. **Never touch the visual tree in the `AfterBuild` event**. Exceptions get swallowed by a try-catch, so you will not see the error. Defer visual tree work to the `Loaded` event.
4. **The two-argument `Thickness` constructor is banned**. WPF on .NET 6 does not support `Thickness(double, double)`, so use the four-argument form `Thickness(left, top, right, bottom)`.
5. **Private fields use a `_` prefix**, for example `_stylusDownTimestamp`. XAML element names use PascalCase, for example `CardEnableInkFade`.
6. **Semantics of IsHighlighter**: always `false` for the regular pen and laser pointer; for the highlighter it is `!Settings.Canvas.HighlighterOverlapEnabled` (false in overlap mode, true in transparent mode).

### XAML control rules (xaml_controls.md)

1. **No `<ComboBox>` may set `Width`, `MinWidth`, or `MaxWidth`**. Remove those properties and let the ComboBox size itself.
2. **Settings entries with a toggle must use `LabeledSettingsCard`**. Do not hand-nest a `ui:ToggleSwitch` inside a `ui:SettingsCard`.
3. **`LabeledSettingsCard` is banned inside `Expander.Items`**. Only `ui:SettingsCard` is allowed inside an Expander (otherwise you get visual nesting problems).
4. **`<SymbolIcon>` must set `FontSize` explicitly**, otherwise it blows up in size at certain DPI settings.
5. **`<ComboBox>` / `<ComboBoxItem>` must not set `Background`**. It overrides the theme style and breaks the selected state.

### Settings page rules (settings_pages.md)

This is the longest standards document (378 lines). The core requirements:

1. **Every settings entry needs a `Header` and a `Description`**. `Header` uses an i18n string; `Description` should clearly explain what the option does and what it affects.
2. **Toggles go on the right side of the card**, using `<LabeledSettingsCard>`.
3. **Group complex settings with an `Expander`** to keep advanced options collapsed.
4. **Settings changes must call main-window methods through `SettingsActionHub`**, not by touching `MainWindow` fields directly.
5. **Saving settings is automatic**. `SettingsManager` calls `SaveSettingsToFile()` after a property changes, so you do not need to save explicitly.

### Toolbar rules (toolbar.md)

1. **The floating toolbar (FloatingToolbar) and the whiteboard toolbar (BoardToolbar) are two independent systems** with no shared interface.
2. **Toolbar items are discovered automatically via reflection**. Implement `IToolbarItem` with a public parameterless constructor and `ToolbarRegistry.Discover()` will find it.
3. **Plugin toolbar items are registered through `RegisterToolbarItem()`** and get wrapped in a `PluginToolbarItemWrapper` to adapt them to `IToolbarItem`.
4. **Toolbar layouts are saved in `Configs/ToolbarConfigs/<name>.json`**, serialized with Newtonsoft.Json, with a backup mechanism (`.json.bak`).

### Popup rules (popups_menus.md)

1. **Every `<Popup>` must be registered with `PopupManagerHelper`**, otherwise `CloseAllPopups()` will not manage it.
2. **Popup content should use `PopupShellContent` or `PopupTabShellContent`**. These two controls provide a consistent title bar, close button, and shadow effect.
3. **`StaysOpen="true"` + `Focusable="true"`**. That way the popup does not close immediately on an outside click (PopupManager handles it centrally).

## Testing requirements

`CONTRIBUTING.md` spells out two categories of testing requirements:

### Hand-written code

1. **A basic build test** — avoid submitting incomplete code.
2. **A basic run test** — for UI changes use the "three-step check" (first the styling, then the behavior, then whether i18n is complete); for backend changes, test what you changed.

### AI-assisted code

1. **When using AI assistance you must understand every line of the change.**
2. **Run comprehensive runtime tests** — cover every area that might be affected, do regression testing, and fix issues specifically.
3. **Blindly using AI to fix things is strictly forbidden.** When a problem shows up, carefully review the suspicious commits from the change.

::: danger Serious consequences
Line 22 of CONTRIBUTING.md warns explicitly: "If we find that you are pretending to understand what you do not and refuse to correct it, we will remove you from the contributor list and permanently ban you from contributing code."
:::

## Other workflows

### publish-sdk-nuget.yml

Packs and publishes `InkCanvas.PluginSdk` and `InkCanvas.Controls` to nuget.org.

**Two ways to trigger it**:

- Push a tag shaped like `sdk-v1.7.19.9` — forces publishing with the version from the tag
- Manual `workflow_dispatch` — accepts `branch` (default `net6`) and `version`; leaving `version` empty uses the version NBGV computes from git state

It requires the repository secret `NUGET_API_KEY`. The concurrency group is `publish-sdk-nuget` with `cancel-in-progress: false` so two publishes cannot interrupt each other.

### sync-net6-to-net10.yml

After a push to `net6` (or a manual trigger), it merges `net6` into `net10`. This workflow does far more than a plain merge:

1. Merges `net6` → `net10`, **resolving conflicts automatically**: csproj files take the `net6` version, then the TFM is switched back to net10
2. Deletes the old `packages.lock.json`
3. Tries `restore` + `build` first (most packages support both net6 and net10, so nothing needs changing)
4. Only if the build fails does it upgrade all NuGet packages to their latest stable versions and re-run `restore` + `build`
5. **Pushes only if the build succeeds**, otherwise it aborts and raises an alert

::: tip You can ignore the net10 branch
`net10` is the migration branch, maintained automatically by this workflow. Day-to-day development only needs `net6`, unless you get a sync failure alert.
:::


## Next steps

- [Environment setup](./environment) — installing VS 2022, the .NET 6 SDK, and the VSTO tooling
- [Build and run](./build-and-run) — the full build, versioning, CI, and packaging flow
- [Code conventions](../core/conventions) — the complete reference for everything under `community/rules/`
