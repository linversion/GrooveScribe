# 更新日志

## [2026-01-20] 音频双模式 + 小节管理功能

### 新增功能

#### 1. 音频双模式架构
- ✅ 实现策略模式支持合成器和采样两种音频模式
- ✅ 合成器模式（Synth）：使用 Tone.js 内置合成器生成音频
- ✅ 采样模式（Sample）：使用原版 GrooveScribe 的 MP3 音频样本
- ✅ 音频模式切换按钮，支持实时切换
- ✅ 模式选择持久化到 localStorage

#### 2. 小节管理功能
- ✅ 添加小节：在末尾添加新小节（最多 10 小节）
- ✅ 删除小节：删除任意小节（最少保留 1 小节）
- ✅ 数据保留策略：添加/删除小节时正确保留已有节奏数据
- ✅ 性能警告：达到 5 小节时显示性能提示
- ✅ UI 控件：每小节显示删除按钮（X），末尾显示添加按钮（+）
- ✅ 小节数量显示：在 TransportControls 中显示当前小节数量

### 改进优化

#### 1. 音频架构
- **策略模式实现**：
  - 创建 `AudioEngineStrategy` 接口统一音频引擎行为
  - `SynthStrategy` 实现 Tone.js 合成器模式
  - `SamplerStrategy` 实现 MP3 采样模式
  - 100ms 防抖优化，模式切换时自动重新初始化

#### 2. 采样模式集成
- ✅ 从原版 GrooveScribe 提取 8 个 MP3 采样文件
  - kick.mp3
  - snare-normal.mp3, snare-accent.mp3, snare-ghost.mp3
  - hihat-closed.mp3, hihat-open.mp3
  - tom-high.mp3, tom-floor.mp3
- ✅ 创建语义化映射文件 `sampleMapping.ts`
- ✅ 采样文件总大小约 57KB，加载快速
- ✅ 支持动态加载进度显示

#### 3. Bug 修复
- ✅ **修复 Hi-hat 无声音问题**：
  - 问题：MetalSynth 的 `triggerAttackRelease` 缺少 note 参数
  - 解决：添加 'C5'（closed）和 'A5'（open）音符参数
  - 文件：`src/strategies/SynthStrategy.ts`

- ✅ **修复 Tooltip 组件缺失**：
  - 问题：项目缺少 `@/components/ui/tooltip` 组件
  - 解决：使用原生 HTML `title` 属性替代
  - 文件：`src/components/MeasureControls.tsx`

#### 4. BPM 调试优化
- ✅ 添加 BPM 速度显示验证信息
- ✅ 在 TransportControls 中显示：
  - 当前 BPM 数值（大字体）
  - BPM 滑块（40-200 范围）
  - 每小节时长计算（秒）
  - 示例："80 BPM = 每小节 3.0 秒"

#### 5. 小节数据管理
- ✅ **添加小节逻辑**：
  - 复制最后一小节内容到新小节
  - 扩展所有乐器的 Note 数组
  - 保持现有节奏数据不变

- ✅ **删除小节逻辑**：
  - 使用 `slice()` 正确保留其他小节数据
  - 自动重置 `currentStep` 为 0
  - 最小限制：1 小节

- ✅ **UI 布局优化**：
  - 每个小节独立卡片显示
  - 小节之间有分隔线
  - 当前步骤高亮跨越多个小节

### 文件变更

#### 新增文件
- `src/strategies/AudioEngineStrategy.ts` - 音频引擎策略接口
- `src/strategies/SynthStrategy.ts` - 合成器模式实现
- `src/strategies/SamplerStrategy.ts` - 采样模式实现
- `src/utils/sampleMapping.ts` - 采样文件映射配置
- `src/components/MeasureControls.tsx` - 小节控制组件
- `src/components/AudioModeToggle.tsx` - 音频模式切换按钮
- `public/samples/*.mp3` - 8 个音频采样文件

#### 修改文件
- `src/store/useDrumStore.ts` - 添加小节管理 actions 和音频模式状态
- `src/hooks/useAudioEngine.ts` - 重构为策略模式
- `src/components/DrumGrid.tsx` - 重构为多小节布局
- `src/components/TransportControls.tsx` - 添加小节数量显示和模式切换
- `CHANGELOG.md` - 更新日志

### 技术细节

#### 策略模式实现
```typescript
// 音频引擎策略接口
interface AudioEngineStrategy {
  initialize(): Promise<void>;
  playInstrument(instrument, noteVelocity, articulation, time): void;
  dispose(): void;
  isReady(): boolean;
  getLoadingProgress(): number;
  getName(): string;
}

// 根据音频模式选择策略
const strategy = audioMode === 'synth'
  ? new SynthStrategy()
  : new SamplerStrategy();
```

#### 小节数据保留
```typescript
// 添加小节：复制最后一小节
const lastMeasureStart = oldTotalSteps - stepsPerMeasure;
for (let i = 0; i < stepsPerMeasure; i++) {
  const sourceNote = oldNotes[lastMeasureStart + i];
  newNotes.push({ ...sourceNote }); // 深拷贝
}

// 删除小节：使用 slice 保留其他数据
const newNotes = [
  ...oldNotes.slice(0, deleteStart),
  ...oldNotes.slice(deleteEnd)
];
```

### 已知问题
- 采样模式下，首次加载采样文件需要 1-2 秒（后续切换无延迟）
- 小节数量达到 8+ 时，UI 渲染可能有轻微延迟（符合预期）

### 后续计划
- [ ] 添加更多预设节奏型
- [ ] 支持小节复制/粘贴功能
- [ ] 添加节奏导入/导出功能
- [ ] 优化多小节性能（虚拟化滚动）

### 贡献者
- White (独立开发)
- Claude Code (AI 辅助开发)

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

## 2025-12-31

### 项目设置
- 克隆了前端项目 GrooveScribe：`git@github.com:linversion/GrooveScribe.git`
- 当前分支：`develop`
- 项目路径：`D:\Claude-Code\GrooveScribe`

### GrooveScribe 项目
- **类型**：鼓编辑器 Web 应用
- **技术栈**：React 18 + TypeScript + Vite + Tailwind CSS
- **核心库**：
  - Tone.js（音频合成）
  - abcjs（五线谱渲染）
  - Zustand（状态管理）
- **主要功能**：
  - 可视化网格编辑器
  - 实时音频播放
  - 五线谱同步显示
  - AI 助手接口（预留）
- **开发命令**：
  - `npm install` - 安装依赖
  - `npm run dev` - 启动开发服务器（端口 5173）
  - `npm run build` - 构建生产版本
  - `npm run lint` - 代码检查
- **核心文件**：
  - `src/store/useDrumStore.ts` - 状态管理
  - `src/hooks/useAudioEngine.ts` - 音频引擎
  - `src/utils/abcGenerator.ts` - ABC 记谱法生成
  - `src/components/DrumGrid.tsx` - 网格编辑器
  - `src/components/ScoreRenderer.tsx` - 五线谱渲染器
- **已创建文件**：`CLAUDE.md` - 项目架构和开发指南

### 2025-12-31 更新
- **配置 Frontend Design**：
  - frontend-design skill 是 Claude Code 内置功能，无需额外安装
  - 已在 `CLAUDE.md` 中添加前端设计规范章节
  - 包含视觉设计、交互设计、组件设计、布局原则
  - 以后所有前端工作都会自动应用这些设计标准

- **原始 GrooveScribe 项目克隆**（2025-12-31）：
  - 克隆了原始项目用于对比：https://github.com/montulli/GrooveScribe.git
  - 本地路径：`D:\Claude-Code\GrooveScribe-original`
  - 运行地址：**http://localhost:8080**
  - **技术栈**：
    - 纯原生 JavaScript（无框架）
    - 使用 abc2svg 库生成五线谱（与改进版使用 abcjs 不同）
    - 使用 jsmidgen 库生成 MIDI
    - HTML + CSS 直接编写
  - **项目结构**：
    - `index.html` - 主应用界面
    - `js/groove_writer.js` - 鼓谱编辑器代码
    - `js/groove_utils.js` - 工具函数（显示、播放）
    - `js/groove_display.js` - 显示组件
    - `js/abc2svg-1.js` - ABC 记谱法转 SVG（注意：原始项目用的是 abc2svg，改进版用的是 abcjs）
  - **运行方式**：使用 Python http.server（端口 8080）
  - **用途**：对比鼓谱渲染结果，验证改进版的正确性

- **前端设计全面优化**（2025-12-31）：
  按照 Frontend Design 标准对整个应用进行了 UI/UX 优化

  1. **全局样式优化**（`src/index.css`）：
     - 增强暗色模式对比度（背景从 4.9% 降到 8%，提升可读性）
     - 添加平滑滚动条样式（圆角、半透明）
     - 增强焦点可见性（符合 WCAG 标准）
     - 优化字体渲染（antialiasing）

  2. **Tailwind 配置增强**（`tailwind.config.js`）：
     - 新增动画：fade-in、slide-in、pulse-subtle
     - 所有动画使用 cubic-bezier 缓动函数

  3. **基础组件优化**：
     - **Button**：添加阴影效果、hover 状态提升、active 缩放反馈
     - **Card**：圆角从 rounded-lg 升级到 rounded-xl，增加 hover 阴影过渡

  4. **核心组件优化**：
     - **DrumGrid**：
       - 增加内边距（p-6 → p-8）
       - 放大按钮尺寸（w-8 h-12 → w-9 h-14）
       - 增强间距（gap-1 → gap-1.5）
       - 添加焦点状态和 aria-label（可访问性）
       - 优化视觉层次（边框、阴影、缩放效果）

     - **ScoreRenderer**：
       - 增加五线谱缩放比例（1.1 → 1.2）
       - 扩大显示区域（800 → 900 staffwidth）
       - 添加悬停阴影过渡效果

     - **TransportControls**：
       - 放大播放按钮（w-12 h-12 → w-14 h-14）
       - 增强阴影效果（shadow-md → shadow-lg）
       - 优化 BPM 显示（字体从 text-sm → text-2xl）
       - 添加渐变背景和 backdrop-blur 效果
       - 音量条添加脉动动画

     - **ChatInterface**：
       - 增强头像样式（边框、阴影）
       - 添加消息淡入动画
       - 优化输入状态指示（三点跳动动画）
       - 改进输入框和按钮尺寸
       - 添加键盘快捷键提示样式

     - **App.tsx**：
       - 优化布局间距（p-8 → px-10 py-8，space-y-8 → space-y-10）
       - 添加渐变背景效果
       - 增强区域标题（描述文字、状态指示器）
       - 添加淡入动画

  5. **设计改进总结**：
     - ✅ **视觉层次**：更清晰的层次结构，改进的间距和大小
     - ✅ **对比度**：暗色模式下更好的文本可读性
     - ✅ **交互反馈**：流畅的动画、hover 状态、点击反馈
     - ✅ **可访问性**：焦点指示器、aria-label、键盘导航
     - ✅ **留白**：更宽松的间距，更好的呼吸感
     - ✅ **一致性**：统一的圆角、阴影、过渡效果

- **开发调试面板**（2025-12-31）：
  - 创建了 `DevDebugPanel` 组件，仅在开发环境显示
  - 功能特性：
    - ✅ **可拖动定位**：点击标题栏拖动到屏幕任意位置
    - ✅ **实时数据监控**：显示播放状态、BPM、当前步数
    - ✅ **乐器序列可视化**：显示每个乐器的激活音符位置和演奏技法
    - ✅ **复制功能**：一键复制 JSON 格式数据到剪贴板
    - ✅ **可折叠**：最小化以减少屏幕占用
    - ✅ **当前步数乐器显示**：播放时高亮当前步数的激活乐器
  - 显示内容：
    - 播放状态（播放中/已暂停）
    - 当前步数索引
    - BPM 速度
    - 激活音符总数
    - 每个乐器的详细序列（normal/accent/ghost）
  - 文件：`src/components/DevDebugPanel.tsx`

- **默认节奏同步**（2025-12-31）：
  - 修改了初始状态以匹配原版 GrooveScribe 的默认节奏
  - **原版 URL 参数**：`?TimeSig=4/4&Div=16&Tempo=80&Measures=1&H=|xxxxxxxxxxxxxxxx|&S=|--O-O-------O---|&K=|o-------o-------|`
  - **默认节奏模式**（Rock 节奏）：
    - **BPM**: 80（从 120 修改为 80）
    - **Hi-hat Closed**: 全部16个位置激活（0-15）
    - **Snare**: 位置 3, 5, 13 为 accent 重音（--O-O-------O---）
    - **Kick**: 位置 1, 9 为 normal 音符（o-------o-------）
  - **实现方式**：
    - 创建了 `createDefaultRockGrid()` 函数
    - 修改 `useDrumStore` 初始状态使用默认节奏
    - BPM 从 120 改为 80
  - 文件修改：`src/store/useDrumStore.ts`

- **双渲染器支持实现**（2025-12-31）：
  - **问题**：改进版五线谱渲染与原版差异太大
  - **根本原因**：使用不同的渲染库（abcjs vs abc2svg）和 ABC 格式
  - **解决方案**：实现双渲染器支持 + 切换按钮
  - **新增文件**：
    1. `public/lib/abc2svg-1.js` - 从原版复制的 abc2svg 库（132KB）
    2. `src/utils/abc2svg.ts` - abc2svg 的 TypeScript 包装器
    3. `src/utils/abcGeneratorOriginal.ts` - 原版风格的 ABC 生成器
    4. `src/components/RendererToggle.tsx` - 渲染器切换按钮组件
  - **修改文件**：
    1. `index.html` - 添加 abc2svg 库的 script 标签
    2. `src/store/useDrumStore.ts` - 添加 `renderer` 状态和 `setRenderer` action
    3. `src/components/ScoreRenderer.tsx` - 支持双渲染器切换
    4. `src/components/TransportControls.tsx` - 集成切换按钮
  - **功能特性**：
    - ✅ 一键切换渲染器（abcjs ↔ abc2svg）
    - ✅ abc2svg 模式使用原版鼓谱符号（`!accent!`、`!plus!` 等）
    - ✅ abcjs 模式保持现代化实现
    - ✅ localStorage 持久化用户选择
    - ✅ 错误处理和回退机制
  - **原版 ABC 格式特点**：
    - 多声部支持（V:1 Feet, V:2 Hands）
    - 丰富的格式化指令（`%%flatbeams`、`%%ornament`）
    - 标准鼓谱符号映射
    - 双声部显示（脚部和手部分离）
  - **使用方法**：
    - 点击顶部栏的"渲染器"按钮即可切换
    - 状态会自动保存到浏览器

### 2026-01-06 更新
- **默认渲染器改为 abc2svg**：
  - 修改了 `src/store/useDrumStore.ts` 第 121 行
  - 默认渲染器从 `abcjs` 改为 `abc2svg`
  - abcjs 代码保留，用户仍可手动切换
  - 原因：abc2svg 渲染结果更接近原版 GrooveScribe

- **部署和 Playwright 测试**（2026-01-06）：
  - 修复了 TypeScript 类型错误（创建 `src/vite-env.d.ts`）
  - 成功构建并启动开发服务器（http://localhost:5173）
  - 使用 Playwright 进行自动化测试
  - 验证了默认渲染器为 abc2svg
  - 测试了渲染器切换功能
  - 生成了三种渲染器的对比截图

- **ABC 生成器单元测试**（2026-01-06）：
  - 安装了 Vitest 测试框架
  - 创建了 `src/utils/abcGenerator.test.ts` 测试文件
  - 编写了 20 个单元测试用例，覆盖：
    - abcjs 生成器的基本功能测试（6 个）
    - abc2svg 生成器的基本功能测试（5 个）
    - 两个生成器的音符内容对比（5 个）
    - 边界情况测试（4 个）
  - **所有 20 个测试全部通过** ✅
  - 验证了两个生成器在相同输入下产生相同的音符序列
  - 测试内容包括：
    - 基本 ABC 头部信息
    - Rock 节奏（默认节奏）生成
    - 和弦（多个乐器同时发声）
    - 休止符处理
    - ghost note 处理
    - 多小节支持
    - 重音标记（!>! vs !accent!）
    - 所有乐器类型（Kick, Snare, Hi-hat, Tom）
  - 添加了测试脚本：
    - `npm test` - 运行测试（watch 模式）
    - `npm run test:ui` - 运行测试（UI 模式）
    - `npm run test:run` - 运行测试（单次）
  - **测试报告**: `docs/ABC_GENERATOR_TEST_REPORT.md`
    - 详细的测试结果和分析
    - 测试用例说明
    - 两个生成器的差异对比
    - 性能分析和建议
