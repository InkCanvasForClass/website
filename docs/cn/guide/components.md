---
title: 页面组件
description: ICC-CE 文档站内置的页面组件使用说明
---

# 页面组件

<HelpUsImprove title="这是个临时页面" text="因为写文档的人要力竭了，所以找个地方一记……" type="content" />

本文档站内置了一些 Vue 组件，可在 Markdown 文章中直接使用。

## Cbox2 导航框

`Cbox2` 是一个带图标的信息导航框，适合在文章末尾引导读者到下一章节。

### 基本用法

```markdown
<Cbox2>内容</Cbox2>
```

<Cbox2>这是默认的绿色导航框，带箭头图标</Cbox2>

### 自定义图标

使用简短名称：

```markdown
<Cbox2 icon="book">阅读指南</Cbox2>
<Cbox2 icon="download">下载相关</Cbox2>
<Cbox2 icon="warning">注意事项</Cbox2>
<Cbox2 icon="tip">小提示</Cbox2>
<Cbox2 icon="note">备注</Cbox2>
<Cbox2 icon="star">推荐内容</Cbox2>
<Cbox2 icon="info">信息</Cbox2>
<Cbox2 icon="github">GitHub 链接</Cbox2>
<Cbox2 icon="question">常见问题</Cbox2>
<Cbox2 icon="search">搜索</Cbox2>
<Cbox2 icon="link">链接</Cbox2>
<Cbox2 icon="clock">时间相关</Cbox2>
<Cbox2 icon="check">已完成</Cbox2>
<Cbox2 icon="cog">设置</Cbox2>
<Cbox2 icon="user">用户相关</Cbox2>
<Cbox2 icon="heart">收藏</Cbox2>
<Cbox2 icon="flag">标记</Cbox2>
<Cbox2 icon="bug">调试</Cbox2>
```

效果示例：

<Cbox2 icon="book">阅读指南</Cbox2>

<Cbox2 icon="download">下载相关</Cbox2>

<Cbox2 icon="warning">注意事项</Cbox2>

### 直接使用 Font Awesome 类名

```markdown
<Cbox2 icon="fas fa-wand-magic-sparkles">魔法效果</Cbox2>
<Cbox2 icon="fab fa-discord">Discord 链接</Cbox2>
<Cbox2 icon="fas fa-paint-brush">绘画相关</Cbox2>
<Cbox2 icon="fas fa-tablet-screen-button">触屏设置</Cbox2>
```

### 切换颜色

支持三种颜色：`green`（默认，导航推荐）、`blue`（信息参考）、`orange`（警告提示）。

```markdown
<Cbox2 color="blue">蓝色变体</Cbox2>
<Cbox2 color="orange">橙色变体</Cbox2>
<Cbox2 color="green" icon="star">绿色 + 自定义图标</Cbox2>
```

<Cbox2 color="blue" icon="info">蓝色信息框</Cbox2>

<Cbox2 color="orange" icon="warning">橙色警告框</Cbox2>

### 复杂内容

支持多行文本、粗体、链接等 Markdown 语法：

```markdown
<Cbox2 icon="book">
  **粗体文本** 和 [链接](https://example.com) 都支持，可以写多行内容。
</Cbox2>
```

<Cbox2 icon="book">
  **粗体文本** 和 [链接](https://example.com) 都支持，可以写多行内容。
</Cbox2>

## 其他组件

### BilibiliVideo

嵌入 B 站视频：

```markdown
<BilibiliVideo bvid="BV1GJ411x7h7" />
```

### Linkcard

链接卡片：

```markdown
<Linkcard url="https://github.com/InkCanvasForClass/community" title="ICC-CE 仓库" description="InkCanvasForClass CE 社区版" />
```

### ArticleMetadata

文章元信息（自动从 frontmatter 读取）：

```markdown
<ArticleMetadata />
```

### HelpUsImprove

"帮助我们改进"提示框：

```markdown
<HelpUsImprove />
```

### UnderConstruction

"正在施工"提示框：

```markdown
<UnderConstruction />
```

### KnownBugs

"已知问题"提示框：

```markdown
<KnownBugs />
```
