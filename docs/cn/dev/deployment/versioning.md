---
title: 版本号体系
description: 三套并存的版本号各自的用途、格式与维护方式
---

# 版本号体系

ICC-CE 同时维护**三套版本号**，用途完全不同，改动前务必分清。

## 一、version.json —— 编译期版本号

由 **Nerdbank.GitVersioning**（NBGV）驱动，在 `Directory.Build.props` 中统一注入，
所有项目共用同一份配置，不需要各自引用。

```json
{
  "version": "1.7.19.9",
  "nugetPackageVersion": { "semVer": 2, "precision": "revision" },
  "git": { "shortShaLength": 6, "getCommitDetails": "always" },
  "buildNumber": { "sha": true, "useAbbreviatedSha": true },
  "assemblyVersion": { "precision": "revision" }
}
```

要点：

- 决定的是**程序集版本**，也就是「关于」里显示的版本
- 精度为 `revision`（四段），构建号中会附带缩写的 commit sha
- 由 NBGV 在编译时结合 Git 历史自动生成，**不要手工改程序集版本属性**
- 发布新版本时改的是这个文件里的 `version` 字段

::: warning NBGV 重复引用
`Directory.Build.props` 里用 `NBGVProvidedByDirectoryBuildProps` 标记了已统一注入。
需要自包含引用 NBGV 的项目（如 `InkCanvas.PluginSdk` 支持独立构建）要判断这个属性，
否则会产生 NU1504 重复引用告警。
:::

## 二、AutomaticUpdateVersionControl.txt —— 在线更新公告板

仓库根目录下的一个纯文本文件，内容只有一行版本号：

```
1.7.18.10
```

它的作用是**告诉已安装的客户端「当前应该更新到哪个版本」**：

- 客户端定期拉取该文件，与自身版本比较来决定是否提示更新
- 通过多条镜像线路分发，保证国内客户端也能读到
- 它的值**可以落后于** `version.json`：新版本编译发布后，先小范围验证，
  确认没问题再更新这个文件，让全量用户开始收到更新提示

::: danger 灰度发布的闸门
这个文件就是更新的总闸门。改动它意味着**所有客户端**都会开始提示更新，
请在确认新版本稳定后再动，且注意不要误填成尚未发布的版本号。
:::

## 三、Git tag —— 发布标记

发布用的四段式 tag，与 GitHub Release 一一对应。约定：

- 末段为 `0` 表示**正式版**
- 末段非 `0` 表示该版本线上的迭代/预发布

下载页正是依赖 tag 来关联两个仓库的资源：`community-beta` 只发绿色版 zip，
安装版按**相同 tag** 回源到主仓库 `community` 获取。因此**两个仓库的 tag 必须严格一致**，
否则下载页会找不到对应的安装版。

## 三者的关系

```
version.json          编译期 → 决定程序集版本，随构建产出
      │
      ▼
Git tag + Release     发布期 → 打标签、上传产物到 GitHub
      │
      ▼
AutomaticUpdate...txt 推送期 → 决定已安装客户端何时收到更新提示
```

## 发布流程中的版本号操作

1. 更新 `version.json` 中的 `version`
2. 编译并生成安装版与绿色版产物
3. 打 Git tag 并创建 Release，上传产物
   - 若同时发布到 `community-beta`，确保 tag 与主仓库一致
4. 小范围验证
5. 确认无误后，更新 `AutomaticUpdateVersionControl.txt`，推送更新提示

::: tip 回滚
发现问题时，把 `AutomaticUpdateVersionControl.txt` 改回上一个稳定版本即可止损，
不需要删除已发布的 Release。
:::
