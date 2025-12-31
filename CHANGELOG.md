# 更新日志

## [2025-12-31] 双渲染器支持 + 五线谱优化

### 新增功能

#### 1. 双渲染器架构
- ✅ 添加 abc2svg 渲染器支持（原版 GrooveScribe 风格）
- ✅ 实现渲染器切换功能（abcjs ↔ abc2svg）
- ✅ 添加 RendererToggle 切换按钮组件
- ✅ 用户选择持久化到 localStorage

#### 2. 核心库集成
- ✅ 集成 abc2svg-1.js 库（244KB）
- ✅ 创建 abc2svg TypeScript 包装器
- ✅ 创建原版风格 ABC 生成器（abcGeneratorOriginal.ts）

### 改进优化

#### 1. 五线谱渲染
- **abc2svg 模式**：
  - 多声部支持（Stickings/Hands/Feet）
  - 完整的鼓谱符号映射（%%map drum）
  - SVG 路径定义（Xhead/Trihead）
  - 标准鼓谱符号（!accent!, !plus!, !open! 等）
  - 休止符合并（zzzz → z4）

- **abcjs 模式**：
  - 保持现代化实现
  - 响应式渲染

#### 2. 主题适配
- ✅ abc2svg 渲染颜色自动适配主题
  - 暗色模式：白色
  - 亮色模式：黑色
- ✅ MutationObserver 监听主题切换，实时更新颜色

#### 3. 默认节奏
- ✅ 同步原版 GrooveScribe 默认节奏
  - BPM: 80
  - Kick: 位置 0, 9（原版从1开始：1, 10）
  - Snare: 位置 2, 4, 13（原版从1开始：3, 5, 14）
  - Hi-hat Closed: 全部 16 个位置

#### 4. 前端设计优化
- ✅ 应用 Frontend Design 标准
- ✅ 增强暗色模式对比度
- ✅ 优化组件间距和尺寸
- ✅ 改进交互反馈（hover、active、focus）
- ✅ 添加动画效果（fade-in、slide-in、pulse-subtle）

#### 5. 开发体验
- ✅ 添加 DevDebugPanel 组件（仅开发环境）
  - 可拖动定位
  - 实时数据监控
  - 乐器序列可视化
  - 一键复制 JSON 数据

### 文件变更

#### 新增文件
- `public/lib/abc2svg-1.js` (244KB) - abc2svg 渲染库
- `src/utils/abc2svg.ts` - abc2svg TypeScript 包装器
- `src/utils/abcGeneratorOriginal.ts` - 原版风格 ABC 生成器
- `src/components/RendererToggle.tsx` - 渲染器切换按钮
- `src/components/DevDebugPanel.tsx` - 开发调试面板
- `CHANGELOG.md` - 更新日志
- `TROUBLESHOOTING.md` - 问题排查指南

#### 修改文件
- `index.html` - 添加 abc2svg 库引用
- `src/store/useDrumStore.ts` - 添加 renderer 状态，修改默认节奏
- `src/components/ScoreRenderer.tsx` - 支持双渲染器，主题适配
- `src/components/TransportControls.tsx` - 集成切换按钮
- `src/components/DrumGrid.tsx` - UI 优化
- `src/components/ChatInterface.tsx` - UI 优化
- `src/App.tsx` - UI 优化，集成调试面板
- `src/index.css` - 全局样式优化
- `tailwind.config.js` - 添加动画配置

### 技术细节

#### 双渲染器实现
```typescript
// 根据用户选择生成不同 ABC
const abcString = renderer === 'abc2svg'
  ? generateAbcOriginal(gridData, stepsPerMeasure, totalMeasures, bpm)
  : generateAbc(gridData, stepsPerMeasure, totalMeasures);

// 使用对应渲染器
if (renderer === 'abc2svg') {
  renderAbc(container, abcString);
  // 主题适配
  updateAbc2svgColor();
} else {
  abcjs.renderAbc(container, abcString, options);
}
```

#### ABC 格式差异
| 特性 | abcjs | abc2svg |
|------|-------|----------|
| 声部 | 单声部 | 多声部（Stickings/Hands/Feet） |
| 重音 | `!>!` | `!accent!` |
| 闭镲 | `^g` | `!plus!^g` |
| 格式化 | 简单 | 丰富（%%flatbeams, %%ornament 等） |
| 符号映射 | 基础 | 完整（%%map drum） |

### 已知问题
- abc2svg 模式下，某些复杂的鼓谱符号可能需要进一步调优
- 休止符显示在小节末尾可能有轻微差异

### 后续计划
- [ ] 改进 abcjs 模式的鼓谱符号映射
- [ ] 添加更多渲染选项（缩放、间距等）
- [ ] 优化大乐谱性能
- [ ] 添加更多预设节奏型

### 贡献者
- White (独立开发)
- Claude Code (AI 辅助开发)
