---
date: 2026-05-05
author:
  - Makitoid
  - Qoder
title: 笔刷效果调节
description: 笔刷效果调节
---
# 笔刷效果调节

## 简介
本技术文档围绕 InkCanvasForClass 的笔刷效果调节系统，系统性解析以下内容：
- 笔刷平滑算法实现：ImprovedBezierSmoothing 与 AdvancedBezierSmoothing 的算法差异与性能特点
- 笔刷淡出效果机制：InkFadeManager 的工作原理与视觉控制
- 笔刷配置参数管理：InkSmoothingConfig 的配置项与调优策略
- 实时预览与性能优化：GPU 加速、内存管理与异步处理
- 自定义与扩展：效果参数动态调整与用户界面交互

## 项目结构
笔刷效果调节相关代码主要集中在 Helpers 目录与 MainWindow 的设置逻辑中：
- 平滑算法与管理：ImprovedBezierSmoothing、AdvancedBezierSmoothing、InkSmoothingManager、HardwareAcceleratedInkProcessor、InkSmoothingConfig
- 淡出效果：InkFadeManager
- 用户界面与设置：MainWindow 设置页与滑块绑定

```mermaid
graph TB
subgraph "平滑与管理"
IMP["ImprovedBezierSmoothing<br/>同步平滑"]
ADV["AdvancedBezierSmoothing<br/>同步平滑"]
ASM["AsyncAdvancedBezierSmoothing<br/>异步平滑"]
HAP["HardwareAcceleratedInkProcessor<br/>GPU加速"]
ISM["InkSmoothingManager<br/>统一管理器"]
ISC["InkSmoothingConfig<br/>配置参数"]
end
subgraph "淡出效果"
IFM["InkFadeManager<br/>渐隐管理"]
end
subgraph "界面与设置"
MWS["MainWindow.Settings<br/>滑块绑定"]
end
ISM --> ASM
ISM --> HAP
ISM --> ISC
IFM --> MWS
```

## 核心组件
- ImprovedBezierSmoothing：面向同步场景的改进三次贝塞尔曲线平滑，包含去噪、自适应插值、重采样与后处理
- AdvancedBezierSmoothing：同步版本的三次贝塞尔曲线平滑，提供更保守的窗口与插值策略
- AsyncAdvancedBezierSmoothing：异步硬件加速平滑，支持并发任务、自适应插值、向量化指数平滑与并行贝塞尔拟合
- HardwareAcceleratedInkProcessor：基于 WPF GPU 的路径几何平滑与并行贝塞尔插值
- InkSmoothingManager：统一调度器，根据配置选择异步/硬件加速/传统同步路径，并记录性能
- InkSmoothingConfig：平滑配置参数与质量等级映射，支持从设置加载与保存
- InkFadeManager：笔迹渐隐管理，按笔迹起点终点创建视觉元素并执行分段/统一动画

## 架构总览
统一由 InkSmoothingManager 决策平滑路径，依据 InkSmoothingConfig 的质量与硬件能力选择：
- 异步模式：AsyncAdvancedBezierSmoothing
- 硬件加速：HardwareAcceleratedInkProcessor
- 传统同步：AdvancedBezierSmoothing 或 ImprovedBezierSmoothing

笔刷淡出由 InkFadeManager 基于 MainWindow 设置的滑块参数驱动，实现渐隐时间与速度倍率控制。

```mermaid
sequenceDiagram
participant UI as "界面/设置"
participant ISM as "InkSmoothingManager"
participant ASM as "AsyncAdvancedBezierSmoothing"
participant HAP as "HardwareAcceleratedInkProcessor"
participant ADV as "AdvancedBezierSmoothing"
participant IMP as "ImprovedBezierSmoothing"
UI->>ISM : 请求平滑笔画
ISM->>ISM : 读取配置/质量等级
alt 异步处理
ISM->>ASM : SmoothStrokeAsync(...)
ASM-->>ISM : 返回平滑笔画
else 硬件加速
ISM->>HAP : SmoothStrokeWithGPU(...)
HAP-->>ISM : 返回平滑笔画
else 传统同步
ISM->>ADV : SmoothStroke(...) 或 IMP : SmoothStroke(...)
ADV-->>ISM : 返回平滑笔画
end
ISM-->>UI : 返回结果并记录性能
```

## 详细组件分析

### ImprovedBezierSmoothing（同步平滑）
- 预处理：去噪点（基于前后点夹角与距离阈值）
- 曲线拟合：三次贝塞尔滑动窗口，自适应插值步数与曲率
- 后处理：重采样与点数上限控制
- 压力插值：沿曲线插值压感，保证视觉一致性

```mermaid
flowchart TD
Start(["开始"]) --> Pre["去噪点<br/>移除过近/锐角点"]
Pre --> Fit["三次贝塞尔拟合<br/>滑动窗口+控制点"]
Fit --> Adaptive["自适应插值步数<br/>基于长度与曲率"]
Adaptive --> Post["后处理<br/>重采样/点数上限"]
Post --> End(["结束"])
```

### AdvancedBezierSmoothing（同步平滑）
- 提供传统三次贝塞尔平滑，窗口大小与步长随点数动态调整
- 点数膨胀阈值保护：超过一定倍数则回退原笔画
- 适合低开销、稳定性的场景

### AsyncAdvancedBezierSmoothing（异步硬件加速平滑）
- 异步处理：信号量控制并发，取消令牌支持取消
- 参数：平滑强度、重采样间隔、插值步数、曲线张力、自适应插值、硬件加速开关
- 优化：向量化指数平滑、并行贝塞尔拟合、宽松的点数限制与重采样策略
- 取消与释放：支持取消全部任务与资源释放

```mermaid
classDiagram
class AsyncAdvancedBezierSmoothing {
+double SmoothingStrength
+double ResampleInterval
+int InterpolationSteps
+bool UseHardwareAcceleration
+int MaxConcurrentTasks
+bool UseAdaptiveInterpolation
+double CurveTension
+SmoothStrokeAsync(originalStroke, onCompleted, cancellationToken) Task~Stroke~
+CancelAllTasks() void
+Dispose() void
}
```

### HardwareAcceleratedInkProcessor（GPU加速）
- 使用 PathGeometry 与 RenderTargetBitmap 进行硬件加速的曲线拟合
- 并行贝塞尔插值，优化三次贝塞尔计算
- 压感插值保持原笔画压感特征

### InkSmoothingManager（统一管理器）
- 根据配置选择异步/硬件加速/传统路径
- 性能监控：记录处理时间并提供统计
- 推荐配置：根据 CPU 核心数与硬件能力自动推荐质量等级与并发数

### InkSmoothingConfig（配置参数）
- 基本平滑参数：强度、重采样间隔、插值步数
- 贝塞尔参数：自适应插值、曲线张力、曲率阈值
- 性能参数：硬件加速、异步处理、并发任务数、点数上限
- 质量等级：性能优先、平衡、质量优先，映射到具体参数
- 设置加载/保存：从 MainWindow.Settings.Canvas 加载与保存

### InkFadeManager（笔刷淡出）
- 添加渐隐：记录起点/终点、创建视觉元素（Path），加入画布
- 渐隐动画：高亮笔采用统一渐隐+轻微缩放，普通笔采用分段渐隐
- 分段策略：按长度与点密度计算分段数，使用 Apple 风格延迟曲线
- 控制参数：渐隐时间、速度倍率、动画时长，支持运行时更新

```mermaid
sequenceDiagram
participant UI as "界面/设置"
participant IFM as "InkFadeManager"
participant CAN as "InkCanvas"
UI->>IFM : 添加渐隐笔画(起点, 终点, 持续时间)
IFM->>IFM : 计算动画时长/分段
IFM->>CAN : 创建视觉元素(Path)并添加到画布
IFM->>IFM : 启动渐隐动画(统一/分段)
IFM->>CAN : 动画完成后移除视觉元素
```

## 依赖关系分析
- InkSmoothingManager 依赖 InkSmoothingConfig、AsyncAdvancedBezierSmoothing、HardwareAcceleratedInkProcessor
- AsyncAdvancedBezierSmoothing 依赖 InkSmoothingConfig 的参数
- InkFadeManager 依赖 MainWindow 设置（滑块）并操作 InkCanvas 子元素
- UI 层通过 MainWindow.Settings 与 InkFadeManager/InkSmoothingManager 交互

```mermaid
graph LR
ISC["InkSmoothingConfig"] --> ISM["InkSmoothingManager"]
ISM --> ASM["AsyncAdvancedBezierSmoothing"]
ISM --> HAP["HardwareAcceleratedInkProcessor"]
MWS["MainWindow.Settings"] --> IFM["InkFadeManager"]
IFM --> CAN["InkCanvas Children"]
```

## 性能考量
- 异步与并发：AsyncAdvancedBezierSmoothing 使用信号量限制并发，避免过度占用 CPU
- 硬件加速：HardwareAcceleratedInkProcessor 利用 WPF GPU 渲染能力，提升曲线拟合效率
- 自适应插值：根据曲线长度与曲率动态调整插值步数，兼顾质量与性能
- 重采样与点数上限：防止点数爆炸，控制内存与绘制成本
- 性能监控：InkSmoothingManager 记录处理时间，便于调优与诊断

## 故障排查指南
- 平滑失败回退：当异步/硬件加速失败或取消时，回退到原始笔画
- 渐隐异常：捕获异常并清理视觉元素，避免残留
- 配置校验：InkSmoothingConfig.Validate 提供参数范围校验
- 性能统计：通过 InkSmoothingManager.GetPerformanceStats 查看平均/最大处理时间与样本数

## 结论
该笔刷效果调节系统通过统一管理器与多种平滑策略，结合硬件加速与异步处理，在保证视觉质量的同时兼顾性能与稳定性。InkFadeManager 提供了自然的笔迹渐隐体验，并通过 UI 滑块实现参数的实时调整。InkSmoothingConfig 的质量等级与参数映射使得不同硬件环境下的用户都能获得合适的体验。

## 附录
- 用户界面交互要点
  - 激光笔渐隐时间：滑块值乘以 1000 毫秒写入 Settings.Canvas.InkFadeTime，InkFadeManager.UpdateFadeTime 实时生效
  - 渐隐速度倍率：滑块值写入 Settings.Canvas.InkFadeSpeedMultiplier，InkFadeManager.UpdateFadeSpeedMultiplier 实时生效
  - 平滑质量与硬件：InkSmoothingManager.GetRecommendedConfig 与 ApplyRecommendedSettings 根据系统能力自动推荐

章节来源
