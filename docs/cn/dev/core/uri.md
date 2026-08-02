---
title: URI 协议调用
description: icc:// 协议的注册、分发与全部命令
---

# URI 协议调用

<UnderConstruction />

程序注册了 `icc://` 协议，外部可以通过一条 URL 来控制它——收纳工具栏、切换工具、清空墨迹、打开设置页等等。

两个关键文件：

- `Helpers\UriSchemeHelper.cs`（118 行）— 注册/注销/检测协议
- `MainWindow_cs\MW_UriHandler.cs`（506 行）— 解析与执行命令

::: tip 只想知道怎么用？
这篇讲的是实现原理。如果你只需要命令地址表和使用方法，看面向用户的 [URL 命令调用](/cn/guide/url-commands)。
:::

## 协议名是 icc，不是 inkcanvas

```csharp
private const string SchemeName = "icc";
private const string FriendlyName = "URL:Ink Canvas Protocol";
```

所有 URL 都是 `icc://` 开头。

## 注册写在 HKCU，不需要管理员

```csharp
// 使用 CurrentUser\Software\Classes 代替 ClassesRoot，无需管理员权限
using (RegistryKey key = Registry.CurrentUser.CreateSubKey(@"Software\Classes\" + SchemeName))
{
    key.SetValue("", FriendlyName);
    key.SetValue("URL Protocol", "");
    ...
    commandKey.SetValue("", "\"" + exePath + "\" \"%1\"");
}
```

::: tip 写 HKCU 的两个后果
好处是普通用户也能注册。代价是**只对当前用户生效**——教室里换个账号登录就得重新注册一次。

另外 `HKEY_CLASSES_ROOT` 里的同名协议优先级更高，如果系统上有其他程序把 `icc` 注册到了 HKLM，用户级注册会被盖掉。
:::

`IsUriSchemeRegistered()` 不只检查键存在，还会把注册的 exe 路径和当前进程路径做规范化比较：

```csharp
string normalizedRegisteredPath = System.IO.Path.GetFullPath(registeredExePath);
string normalizedCurrentPath = System.IO.Path.GetFullPath(currentExePath);
return string.Equals(normalizedRegisteredPath, normalizedCurrentPath, StringComparison.OrdinalIgnoreCase);
```

::: danger 换个目录后会静默失效，而且开关看不出来
绿色软件经常被整个目录拷来拷去。路径一变，`IsUriSchemeRegistered()` 就返回 false，但注册表里的旧路径**还在**，`icc://` 依然指向旧位置的 exe。

更麻烦的是设置页看不出问题。`LoadSettings()` 只读设置值：

```csharp
ToggleSwitchExternalProtocol.IsOn = settings.Advanced.IsEnableUriScheme;
```

它**不调用** `IsUriSchemeRegistered()`。所以移动目录后开关照旧显示为开启，用户以为功能正常，实际命令已经打不到新位置。

恢复办法是把开关关掉再打开。关的时候 `IsUriSchemeRegistered()` 返回 false，走 `success = true` 分支，**并不会真的删除那个残留的旧键**；再打开时 `RegisterUriScheme()` 用新路径覆盖写入，这才恢复。
:::

## 默认关闭，要手动开

```csharp
[JsonProperty("isEnableUriScheme")]
public bool IsEnableUriScheme { get; set; } = false;
```

开关在设置的「启动」页（`ToggleSwitchExternalProtocol`）。打开时先注册注册表项，成功了才写设置：

```csharp
if (newState)
{
    if (!UriSchemeHelper.IsUriSchemeRegistered())
        success = UriSchemeHelper.RegisterUriScheme();
}
...
if (success)
{
    SettingsManager.Settings.Advanced.IsEnableUriScheme = newState;
    SettingsManager.SaveSettingsToFile();
}
```

::: danger 关掉开关后 URL 会被静默忽略
`HandleUriCommand` 第一件事就是查这个开关：

```csharp
if (!Settings.Advanced.IsEnableUriScheme)
{
    LogHelper.WriteLogToFile($"URI 协议已禁用，忽略请求: {uri}", LogHelper.LogType.Warning);
    return;
}
```

只写一条 Warning 日志，**没有任何界面提示**。排查「URL 点了没反应」时先确认这个开关是开的。
:::

## 命令怎么传到程序里

分两条路径，看程序有没有在运行。

**程序未运行**：Windows 拉起 exe 并把 URL 作为命令行参数传进来，`App_Startup` 末尾处理：

```csharp
string startupUriArg = e.Args.FirstOrDefault(a => a.StartsWith("icc:", StringComparison.OrdinalIgnoreCase));
if (!string.IsNullOrEmpty(startupUriArg))
{
    ...
    mainWindow.Dispatcher.Invoke(() => mainWindow.HandleUriCommand(startupUriArg));
}
```

**程序已运行**：新进程发现已有实例，通过 IPC 把 URL 转发过去，由 `FileAssociationManager` 侧收到后调用：

```csharp
// 获取主窗口并处理URI命令
if (Application.Current.MainWindow is MainWindow mainWindow)
{
    mainWindow.HandleUriCommand(uri);
}
```

带 URL 参数的启动还会影响启动策略——`App.xaml.cs:772` 有个判定，`icc:` 开头的参数和 `.icstk` 文件一样被视为「有外部请求」，会改变单实例分支的走向。

## 解析规则

```csharp
private static string ParseUriCommand(string uri)
{
    if (... !uri.Trim().StartsWith("icc:", ...)) return "";

    if (Uri.TryCreate(uri, UriKind.Absolute, out Uri uriObj))
    {
        string host = (uriObj.Host ?? "").Trim().ToLowerInvariant();
        string path = (uriObj.AbsolutePath ?? "").Trim('/').ToLowerInvariant();
        if (!string.IsNullOrEmpty(host))
            return string.IsNullOrEmpty(path) ? host : host + "/" + path;
        ...
    }

    string raw = uri.Trim().Substring(4).TrimStart('/').ToLowerInvariant();
    return raw;
}
```

`host` 和 `path` 拼成一个命令串，全部转小写。所以 `icc://Fold` 和 `icc://fold` 等价。

::: tip 命令大小写不敏感，方案名大小写敏感
命令本身走 `ToLowerInvariant()`。但查询参数的值经过 `Uri.UnescapeDataString` 后**原样保留**，`config-profile/switch?name=Default` 里的方案名是区分大小写的。
:::

`Uri.TryCreate` 失败时还有个兜底分支，直接截掉 `icc:` 前缀用剩下的字符串。

## 危险命令有 3 秒去重

```csharp
private static readonly HashSet<string> _uriNonRepeatableCommands = new HashSet<string>
{
    "restart", "restart/admin", "restart/normal", "exit", "quit"
};
private static readonly TimeSpan _uriCommandDebounceWindow = TimeSpan.FromSeconds(3);
```

重启和退出这 5 条命令在 3 秒内重复调用会被丢弃。防止中控软件连点造成反复重启。其他命令不去重。

## 全部命令

同一个动作往往有多个别名，下面按功能分组。

### 工具栏显隐

| 命令 | 行为 |
| --- | --- |
| `fold` | 收纳工具栏 |
| `unfold` / `show` | 展开工具栏 |
| `toggle` | 收纳与展开互切 |
| `thoroughhideon` | 开启「收纳时彻底隐藏」 |
| `thoroughhideoff` | 关闭并立即恢复可见 |
| `thoroughhidetoggle` | 切换该设置 |

`thoroughhide*` 三条会**写入并保存设置**，不只是临时状态。

### 生命周期

| 命令 | 行为 |
| --- | --- |
| `restart` | 以当前权限重启 |
| `restart/admin` | 提权重启 |
| `restart/normal` | 降权为普通用户重启 |
| `exit` / `quit` | 退出程序 |

这 4 组都先 `Task.Delay(300)` 再执行，留时间给通知显示。

### 墨迹与历史

| 命令 | 行为 |
| --- | --- |
| `clear` / `clearink` | 清空墨迹 |
| `clearall` / `clearinkandhistory` | 清空墨迹与撤销历史 |
| `undo` | 撤销 |
| `redo` | 重做 |

### 白板页

| 命令 | 行为 |
| --- | --- |
| `nextpage` / `page/next` | 下一页 |
| `previouspage` / `prevpage` / `page/previous` | 上一页 |
| `newpage` / `page/add` | 新建页 |
| `deletepage` / `page/delete` | 删除当前页 |

### 功能入口

| 命令 | 行为 |
| --- | --- |
| `rand` | 随机点名 |
| `randone` | 抽单人 |
| `timer` | 倒计时 |
| `whiteboard` / `board` | 白板模式 |
| `screenshot` | 截图并插入 |

### 工具切换

`tool/` 前缀：

| 命令 | 工具 |
| --- | --- |
| `tool/pen` / `tool/color` | 画笔 |
| `tool/cursor` | 光标 |
| `tool/eraser` | 面积橡皮 |
| `tool/eraserbystrokes` / `tool/eraserstroke` | 笔画橡皮 |
| `tool/select` / `tool/lasso` | 套索选择 |

::: warning 切橡皮会先切到画笔

```csharp
case "eraser":
    PenIcon_Click(null, null);
    EraserIcon_Click(null, null);
    break;
```

橡皮属于画笔面板下的子工具，必须先激活画笔面板。写自动化脚本时不要假设 `tool/eraser` 是原子操作。
:::

### 墨迹冻结

每组四个别名，行为相同：

| 命令 | 行为 |
| --- | --- |
| `freeze` / `lock` / `ink-freeze` / `ink/lock` | 冻结页面 |
| `unfreeze` / `unlock` / `ink-unfreeze` / `ink/unlock` | 解冻（跳过验证） |
| `freeze/start` / `lock/start` / … | 课程开始 |
| `freeze/end` / `lock/end` / … | 课程结束 |
| `freeze/cancel` / `lock/cancel` / … | 取消 |

支持 `?page=` 指定页码，范围 **0–100**：

```csharp
string pageText = GetUriQueryValue(uri, "page");
if (int.TryParse(pageText, out int page) && page >= 0 && page <= 100)
    return page;

return allowMissing ? -1 : GetCurrentFreezePageIndex();
```

不传或超范围就用当前页。只有 `freeze/end` 用 `allowMissing: true`，缺参数时返回 -1。

::: warning unfreeze 跳过验证
`UnfreezePageAsync(..., skipVerification: true)`。如果页面设了解冻密码，走 URI 会**绕过密码检查**。协议开关默认关闭，某种程度上是这个行为的补偿。
:::

### 配置方案

```txt
icc://config-profile/list
icc://config-profile/switch?name=方案名
```

这两条命令**通过临时文件回传结果**，因为 URL 协议本身是单向的：

| 命令 | 输出文件 |
| --- | --- |
| `config-profile/list` | `%TEMP%\InkCanvasConfigProfileList.json` |
| `config-profile/switch` | `%TEMP%\InkCanvasConfigProfileSwitchResult.txt` |
| `tool/state` | `%TEMP%\InkCanvasToolState.txt` |

list 的 JSON 结构：

```csharp
var payload = new { list = names, current = current };
```

switch 的结果文件内容是三种之一：`ok`、`error: 缺少参数 name`、`error: 方案不存在或应用失败`。

`tool/state` 写当前工具名，取不到时写 `"cursor"`。

::: danger 读结果文件要自己处理时序
程序是异步写文件的，调用方发出 URL 后**没有任何完成信号**。脚本里得轮询文件的修改时间，或者先删掉旧文件再等它出现。直接读可能拿到上一次的残留内容。

这些文件也不会被清理，一直留在 `%TEMP%`。
:::

### 设置页导航

```txt
icc://settings[/<PageTag>][?key=<SettingsJsonKey>]
```

例子（来自代码注释）：

```txt
icc://settings/CanvasPage?key=inkFadeSpeedMultiplier
```

不带 PageTag 时默认 `HomePage`。`key` 会高亮对应的设置项。

实现上有几处值得注意：

复用已打开的设置窗口，不会开第二个：

```csharp
foreach (Window w in Application.Current.Windows)
{
    if (w is Windows.SettingsViews.SettingsWindow sw) { window = sw; break; }
}
```

新建窗口时抑制默认导航：

```csharp
// 跳过 Loaded 中默认导航到 HomePage 的行为，由本方法指定目标页
window.SuppressInitialNavigation = true;
```

高亮是延迟触发的：

```csharp
// 设置挂起的高亮 key，等页面 Loaded 后再触发，避免可视树尚未构建导致高亮失效
window.SetPendingHighlightKey(settingKey);
```

还会同步 `_settingsWindow` 静态字段，让工具栏的设置按钮复用同一个窗口。

::: warning key 用的是 JSON 键名
`?key=inkFadeSpeedMultiplier` 是 `Settings.json` 里的键名（`JsonProperty` 的值），和插件 `ISettingsService` 用 C# 属性名的规则**正好相反**。详见 [设置系统](./settings)。
:::

::: warning PageTag 拼错会静默失败
`NavigateToPage()` 找不到页面类型时直接 return，窗口会打开但停在空白或上一页。参见 [代码规范](./conventions)。
:::

## 出错都只记日志

整个 `HandleUriCommand` 包在一个 try-catch 里：

```csharp
catch (Exception ex)
{
    LogHelper.WriteLogToFile($"处理 URI 命令时出错: {ex.Message}", LogHelper.LogType.Error);
}
```

未知命令也一样：

```csharp
LogHelper.WriteLogToFile($"未知的 URI 命令: {command}", LogHelper.LogType.Warning);
```

::: tip 调试 URI 就看日志
所有分支都有日志：收到什么命令、有没有被禁用、有没有被去重、命令是否识别。`<程序目录>\Logs\` 下按时间找。
:::

## 加一条新命令

在 `HandleUriCommand` 的 switch 里加 case，或者在后面加一个 `pathLower.StartsWith(...)` 分支。注意：

- 命令串已经是小写，case 标签也必须写小写，否则永远匹配不上
- 有破坏性的命令记得加进 `_uriNonRepeatableCommands`
- 需要回传结果就写 `%TEMP%` 文件，参照现有三个的命名
- 参数用 `GetUriQueryValue(uri, "key")` 取，它已经处理了 URL 解码

## 下一步

- [启动流程](./startup) — 单实例与 IPC 转发
- [设置系统](./settings) — `IsEnableUriScheme` 与设置键名规则
- [代码规范](./conventions) — 设置页 PageTag 注册
