# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

GrooveScribe 是一个基于 Web 的鼓编辑器应用，允许用户创建、编辑和播放鼓节奏，并能实时生成五线谱显示。这是一个从原生 JavaScript 重构到 React + TypeScript 的现代化项目。

## 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（默认端口 5173）
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview

# 代码检查
npm run lint
```

## 技术栈

- **React 18.2.0** + **TypeScript 5.2.2** - 核心框架
- **Vite 5.1.6** - 构建工具
- **Zustand 4.5.2** - 状态管理
- **Tone.js 14.7.77** - 音频合成和播放
- **abcjs 6.2.2** - ABC 记谱法渲染（五线谱）
- **Tailwind CSS 3.4.1** - 样式框架
- **Radix UI** - 无障碍 UI 组件库

## 高层架构

### 数据流
```
用户交互 → DrumGrid → Zustand Store → useAudioEngine → Tone.js
                               ↓
                           abcGenerator → ScoreRenderer
```

### 核心模块

1. **状态管理** (`src/store/useDrumStore.ts`)
   - 使用 Zustand 管理鼓谱数据
   - 6 种打击乐器：Kick、Snare、Hi-Hat Closed/Open、High Tom、Floor Tom
   - 音符属性：active、velocity、articulation (normal/accent/ghost)
   - BPM 和播放状态控制

2. **音频引擎** (`src/hooks/useAudioEngine.ts`)
   - 使用 Tone.js 创建合成器
   - 不同乐器使用不同合成器类型（MembraneSynth、NoiseSynth、MetalSynth）
   - 使用 Tone.Part 管理音序，支持实时更新
   - 100ms 防抖优化避免频繁重建音序

3. **UI 组件**
   - `DrumGrid.tsx` - 网格编辑器（16 步，可扩展）
   - `ScoreRenderer.tsx` - 五线谱渲染器（基于 abcjs）
   - `TransportControls.tsx` - 播放控制栏
   - `ChatInterface.tsx` - AI 助手界面（当前为演示级实现）

4. **工具模块**
   - `abcGenerator.ts` - 将网格数据转换为 ABC 记谱法

### 组件分层

1. **展示层** - DrumGrid、ScoreRenderer、ChatInterface
2. **业务逻辑层** - useDrumStore、useAudioEngine、abcGenerator
3. **基础设施层** - Tone.js、abcjs、Radix UI

## 代码规范

- 使用函数组件和 Hooks
- TypeScript 严格模式
- 组件样式使用 Tailwind CSS + cn() 工具函数
- 状态更新保持不可变性（Zustand 支持）

## 前端设计规范

遵循 **Frontend Design** 最佳实践：

### 视觉设计
- **排版**：使用清晰的字体层次，保持一致的行高和字间距
- **色彩**：基于 Tailwind 的颜色系统，确保足够的对比度（WCAG AA 标准）
- **间距**：使用 4px 基础网格系统（Tailwind 的 spacing scale）
- **阴影**：适度使用阴影增强深度感，避免过度使用

### 交互设计
- **反馈**：所有交互提供即时视觉反馈（hover、active、disabled 状态）
- **动画**：使用 Tailwind animate 和过渡效果，保持流畅自然
- **可访问性**：
  - 所有交互元素支持键盘导航
  - 使用语义化 HTML 标签
  - 提供清晰的焦点指示器
  - 确保颜色对比度符合标准

### 组件设计
- **一致性**：遵循 Radix UI 组件模式，保持统一的交互行为
- **可复用**：通过 props 实现组件变体（使用 class-variance-authority）
- **响应式**：移动优先设计，使用 Tailwind 的响应式修饰符

### 布局原则
- **网格系统**：使用一致的布局网格
- **留白**：给内容足够的呼吸空间
- **对齐**：保持元素对齐的一致性
- **层次**：通过大小、颜色、位置建立视觉层次

## 重要文件

- `src/store/useDrumStore.ts` - 全局状态管理，理解数据结构的关键
- `src/hooks/useAudioEngine.ts` - 音频引擎核心逻辑
- `src/utils/abcGenerator.ts` - 网格数据到五线谱的转换逻辑
- `vite.config.ts` - Vite 配置，包含路径别名 @ 指向 src

## 项目特色

- 实时音频合成（Web Audio API）
- 可视化网格编辑
- 五线谱同步渲染
- AI 助手接口（预留）
- 从原生 JS 渐进式重构到现代 React

## 遗留代码

`legacy_codebase/` 目录包含原始的原生 JavaScript 实现，作为功能参考保留。
