---
title: 配置文件与数据目录
description: ICC-CE 的配置文件、墨迹存档、截图、日志等数据文件的存放位置和结构说明
---

# 配置文件与数据目录

<KnownBugs />

ICC-CE 的用户数据默认保存在 `%AppData%\InkCanvasForClass CE\` 目录下。

## 配置文件

所有设置项保存在 `%AppData%\InkCanvasForClass CE\Configs\` 中：

- **Settings.json** — 主配置文件，包含所有设置项
- **CustomColors.json** — 自定义颜色配置
- **Toolbar.json** — 工具栏布局配置

## 墨迹与截图

- **自动保存墨迹**：`%AppData%\InkCanvasForClass CE\Saves\`
- **截图保存位置**：`%USERPROFILE%\Pictures\Ink Canvas Screenshots\`（可在设置中更改）
- **按日期分文件夹**：截图可按日期组织（设置中可选）

## 日志文件

- **日志目录**：`%AppData%\InkCanvasForClass CE\Logs\`
- **日志文件**：按日期滚动，可在设置中调整日志级别和文件大小限制

## 其他数据

- **插件目录**：可在设置中自定义插件存放位置
- **更新缓存**：`%AppData%\InkCanvasForClass CE\Updates\`，启动时自动清理
- **崩溃报告**：`%AppData%\InkCanvasForClass CE\CrashReports\`

## 快速定位

按 <kbd>Win</kbd> + <kbd>R</kbd>，输入 `%AppData%\InkCanvasForClass CE` 即可快速打开数据目录。

## 备份与迁移

| 场景 | 操作 |
| --- | --- |
| 重装系统前备份 | 备份 `%AppData%\InkCanvasForClass CE\` 整个目录 |
| 迁移到新电脑 | 复制备份数据到新电脑的相同路径 |
| 清理配置 | 删除 `Settings.json`，程序将在下次启动时生成默认配置 |
| 完全清理 | 删除 `%AppData%\InkCanvasForClass CE\` 整个目录 |